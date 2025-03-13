import { useRouter } from "next/navigation"

export const PREFFERED_DIMS_MAP = ["420p (858x480)", "720p (1280x720)", "1080p (1920x1080)"]

export default function DimensionSelector({ className, preferredDims, onChange }: { className?: string, preferredDims: number, onChange: (value: number) => void }) {
  const router = useRouter();

  return (
    <select className={className}
    value={preferredDims}
    onChange={(e) => {
		try {
			onChange(parseInt(e.target.value))
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