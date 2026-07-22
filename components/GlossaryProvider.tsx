import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import glossaryData from '@/assets/glossary.json';

export type GlossaryEntry = {
  term: string;
  definition: string;
};

type GlossaryContextType = {
  terms: GlossaryEntry[];
  searchTerms: (query: string) => GlossaryEntry[];
  getTerm: (term: string) => GlossaryEntry | undefined;
  selectedTerm: GlossaryEntry | null;
  setSelectedTerm: (entry: GlossaryEntry | null) => void;
  isModalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

const GlossaryContext = createContext<GlossaryContextType | undefined>(undefined);

export const GlossaryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedTerm, setSelectedTerm] = useState<GlossaryEntry | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Convert raw glossary JSON to sorted array
  const terms: GlossaryEntry[] = useMemo(() => {
    return Object.entries(glossaryData)
      .map(([term, definition]) => ({ term, definition: definition as string }))
      .sort((a, b) => a.term.localeCompare(b.term));
  }, []);

  const searchTerms = useCallback(
    (query: string): GlossaryEntry[] => {
      if (!query.trim()) return terms.slice(0, 50); // Return first 50 when empty

      const q = query.toLowerCase();
      return terms
        .filter(
          (entry) =>
            entry.term.toLowerCase().includes(q) ||
            entry.definition.toLowerCase().includes(q),
        )
        .slice(0, 30); // Limit results for performance
    },
    [terms],
  );

  const getTerm = useCallback(
    (term: string): GlossaryEntry | undefined => {
      return terms.find(
        (t) => t.term.toLowerCase() === term.toLowerCase(),
      );
    },
    [terms],
  );

  return (
    <GlossaryContext.Provider
      value={{
        terms,
        searchTerms,
        getTerm,
        selectedTerm,
        setSelectedTerm,
        isModalVisible,
        setModalVisible,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </GlossaryContext.Provider>
  );
};

export const useGlossary = (): GlossaryContextType => {
  const context = useContext(GlossaryContext);
  if (!context) {
    throw new Error('useGlossary must be used within a GlossaryProvider');
  }
  return context;
};
