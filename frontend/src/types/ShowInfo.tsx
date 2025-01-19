

export type ShortInfo = {
  id: number
  title: string
  type: string
  date: string
  poster_path: string
}

export type Genre = {
  id: number
  name: string
}

export type EpisodeInfo = {
  air_date: string
  episode_number: number
  id: number
  title: string
  overview: string
  production_code: string
  runtime: number
  season_number: number
  show_id: number
  still_path: string
  vote_average: number
  vote_count: number
}

export type Network = {
  id: number
  logo_path: string
  name: string
  origin_country: string
}

export type Company = {
  id: number
  logo_path: string
  name: string
  origin_country: string
}

export type Country = {
  iso_3166_1: string
  name: string
}

export type Season = {
  air_Date: string
  episode_count: number
  id: number
  name: string
  overview: string
  poster_path: string
  season_number: number
  vote_average: number
}

export type Language = {
  english_name: string
  iso_639_1: string
  name: string
}

export type MovieInfo = {
  budget: number
  imdb_id: string
  release_date: string
  revenue: number
  runtime: number
  status: string
}

export type TVInfo = {
  episode_run_time: number[]
  first_air_date: string
  in_production: boolean
  languages: string[]
  last_air_date: string
  last_episode_to_air: EpisodeInfo
  next_episode_to_air: string
  networks: Network[]
  number_of_episodes: number
  number_of_seasons: number
  origin_country: string[]
  seasons: Season[]
}

export type Cast = {
  id: number
  known_for_department: string
  name: string
  original_name: string
  character: string
}

export type Crew = {
  id: number
  known_for_department: string
  name: string
  original_name: string
  department: string
  job: string
}

export type FullInfo = {
  adult: boolean
  backdrop_path: string
  genres: Genre[]
  homepage: string
  id: number
  original_language: string
  overview: string
  popularity: number
  poster_path: string
  production_companies: Company[]
  production_countries: Country[]
  spoken_languages: Language[]
  tagline: string
  type: string
  vote_average: number
  vote_count: number
  title: string
  original_title: string
  details: MovieInfo | TVInfo
  credits: {
    cast: Cast[]
    crew: Crew[]
  }
}


export type TVSeasonInfo = {
  air_date: string
  episodes: EpisodeInfo[]
  title: string
  overview: string
  id: number
  poster_path: string
  season_number: number
  vote_average: number
}