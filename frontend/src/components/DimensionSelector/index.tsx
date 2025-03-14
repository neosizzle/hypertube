import { useRouter } from "next/navigation"
import { useEffect, useState } from "react";

export const PREFFERED_DIMS_MAP = ["420p (858x480)", "720p (1280x720)", "1080p (1920x1080)"]

export default function DimensionSelector({ className }: { className?: string }) {
  
  const [selectedDims, setSelectedDims] = useState(null)
  const router = useRouter();

  useEffect(() => {
    fetch(`http://localhost:8000/api/users/me`, {
      method: 'GET',
      credentials: 'include',
    }).then((data) => {
      if (data.ok) {
        data.json().then((json) => {
          setSelectedDims(json.prefered_stream_dimensions)
        })
      }
    })
  }, [])

  useEffect(() => {
    fetch('http://localhost:8000/api/users/me', {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prefered_stream_dimensions: selectedDims
      })
    }).catch(() => {
      router.push('/error')
    })
  }, [selectedDims])

  if (selectedDims === null)
    return (<div>Loading</div>)


  return (
    <select className={className}
    value={selectedDims}
    onChange={(e) => {
		try {
			setSelectedDims(parseInt(e.target.value))
		} catch {
      router.push("/error")
		}
	}}>
      {
        PREFFERED_DIMS_MAP.map((dim, i) =>  (<option key={i} value={i}>{dim}</option>))
      }
    </select>
  )
}