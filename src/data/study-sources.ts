export const studySources = {
  skeletal: { name: 'Merck Veterinary Manual', title: 'Musculoskeletal system', url: 'https://www.merckvetmanual.com/musculoskeletal-system/musculoskeletal-system-introduction/overview-of-the-musculoskeletal-system-in-animals' },
  muscular: { name: 'University of Minnesota', title: 'Dog and cat dissection guide', url: 'https://pressbooks.umn.edu/dogcatanatomylabguide/' },
  digestive: { name: 'Merck Veterinary Manual', title: 'Digestive system', url: 'https://www.merckvetmanual.com/digestive-system/digestive-system-introduction/the-digestive-system-in-animals' },
  cardiovascular: { name: 'Merck Veterinary Manual', title: 'Cardiovascular system', url: 'https://www.merckvetmanual.com/circulatory-system/cardiovascular-system-introduction/the-cardiovascular-system-in-animals' },
  nervous: { name: 'Merck Veterinary Manual', title: 'Parts of the nervous system', url: 'https://www.merckvetmanual.com/dog-owners/brain%2C-spinal-cord%2C-and-nerve-disorders-of-dogs/parts-of-the-nervous-system-in-dogs' },
  bird: { name: 'Cornell Lab of Ornithology', title: 'Bird anatomy glossary', url: 'https://academy.allaboutbirds.org/bird-academys-a-to-z-glossary-of-bird-terms/' },
  birdDigestive: { name: 'Colorado State University', title: 'Digestive anatomy of birds', url: 'https://vivo.colostate.edu/hbooks/pathphys/digestion/birds.html' },
  birdMuscular: { name: 'University of Puget Sound', title: 'Bird dissection', url: 'https://www.pugetsound.edu/puget-sound-museum-natural-history/biodiversity-resources/birds/bird-dissection' },
  liver: { name: 'Colorado State University', title: 'Liver and biliary system', url: 'https://vivo.colostate.edu/hbooks/pathphys/digestion/liver/index.html' },
} as const

export type StudyFacts = readonly [description: string, purpose: string, remember: string, question: string]
