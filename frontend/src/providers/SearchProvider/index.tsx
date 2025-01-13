'use client'

import { createContext, ReactNode, useState } from "react"

// context for search query
interface SearchContextProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  isOpen: boolean
  setIsOpen: (state: boolean) => void
}

export const SearchContext = createContext<SearchContextProps>({
  searchQuery: '',
  setSearchQuery: () => {},
  isOpen: false,
  setIsOpen: () => {}
})

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <SearchContext.Provider value={{searchQuery, setSearchQuery, isOpen, setIsOpen}}>
      {children}
    </SearchContext.Provider>
  )
}
