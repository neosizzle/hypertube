import { Video } from "./Video"

export type User = {
	id: number
	discord_iden: string
	ft_iden: string
	github_iden: string
	lang: string
	first_name: string
	last_name: string
	email: string | null
	profile_picture: string,
	username: string
	watched_videos: [Video]
	prefered_stream_dimensions: number
  }
  
  