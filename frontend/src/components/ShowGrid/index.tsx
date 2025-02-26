import { ShortInfo } from "@/types/ShowInfo";
import ShowCard from "../ShowCard";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useEffect, useState } from "react";
import { User } from "../../types/User";

type ShowGridProps = {
  data: ShortInfo[]
  handleClickShowCard: (data: ShortInfo) => void
}

export default function ShowGrid({ data, handleClickShowCard }: ShowGridProps) {

  const { isSm } = useBreakpoint("sm")
  const { isMd } = useBreakpoint("md")
  const { isLg } = useBreakpoint("lg")
  const { isXl } = useBreakpoint("xl")
  const { is2xl } = useBreakpoint("2xl")

  const getCardPosition = (index: number) => {

    const isFirstInRow = (index: number) => {
      if (is2xl) return (index % 6 == 0)
      if (isXl) return (index % 5 == 0)
      if (isLg) return (index % 4 == 0)
      if (isMd) return (index % 3 == 0)
      if (isSm) return (index % 2 == 0)
    }

    const isLastInRow = (index: number) => {
      if (is2xl) return (index % 6 == 5)
      if (isXl) return (index % 5 == 4)
      if (isLg) return (index % 4 == 3)
      if (isMd) return (index % 3 == 2)
      if (isSm) return (index % 2 == 1)
    }

    return (isFirstInRow(index) ? "left" : (isLastInRow(index) ? "right" : "center"))
  }

  const [watchedVideosId, setWatchedVideosId] = useState<number[]>([]);

  // handle get user watched videos
  useEffect(() => {
    fetch(`http://localhost:8000/api/users/me`, {
      method: 'GET',
      credentials: 'include',
    }).then((data) => {
      if (data.ok) {
        data.json().then((json : User) => {
          setWatchedVideosId(json.watched_videos.map((x) => x.tmdb_id))
        })
      }
    })
    .catch()
  }, [])
  

  return (
    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 
      gap-x-2 gap-y-2 md:gap-y-16 lg:gap-y-20 justify-center lg:justify-start'>
      {
        data?.map((info, i) => (<ShowCard info={info} key={i} onClick={() => handleClickShowCard(info)} isWatched={watchedVideosId.includes(info.id)} position={getCardPosition(i)}/>))
      }
    </div>
  )
}