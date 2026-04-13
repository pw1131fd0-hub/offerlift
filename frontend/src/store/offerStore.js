import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useOfferStore = create(
  persist(
    (set, get) => ({
      offers: [],
      darkMode: false,
      language: 'zh-TW',

      // Offer actions
      setOffers: (offers) => set({ offers }),
      addOffer: (offer) => set((state) => ({ offers: [...state.offers, { ...offer, id: Date.now() }] })),
      removeOffer: (id) => set((state) => ({ offers: state.offers.filter((o) => o.id !== id) })),
      updateOffer: (id, data) =>
        set((state) => ({
          offers: state.offers.map((o) => (o.id === id ? { ...o, ...data } : o)),
        })),

      // UI actions
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'offerlift-storage',
    }
  )
)
