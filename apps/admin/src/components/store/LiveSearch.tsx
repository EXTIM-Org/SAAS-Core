'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  InstantSearch,
  Configure,
  useInstantSearch,
  useSearchBox,
} from 'react-instantsearch';
import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const typesenseAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: process.env.NEXT_PUBLIC_TYPESENSE_API_KEY || 'xyz',
    nodes: [
      {
        host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || 'localhost',
        port: parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT || '8108', 10),
        protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || 'http',
      },
    ],
  },
  additionalSearchParameters: {
    query_by: 'name,description',
  },
});

const searchClient = typesenseAdapter.searchClient;

function CustomSearchBox() {
  const { query, refine } = useSearchBox();

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search products..."
        className="pl-8 bg-background"
        value={query}
        onChange={(e) => refine(e.currentTarget.value)}
      />
    </div>
  );
}

function CustomHits({
  projectId,
  onSelect,
}: {
  projectId: string;
  onSelect: () => void;
}) {
  const { results } = useInstantSearch();

  if (!results || !results.hits || results.hits.length === 0) {
    if (results && results.query) {
      return (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No products found.
        </div>
      );
    }
    return null; // Don't show "no results" if empty query
  }

  if (!results.query) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {results.hits.map((hit: unknown) => {
        const productHit = hit as {
          id: string;
          name: string;
          description: string;
          price: number;
        };
        return (
          <Link
            key={productHit.id}
            href={`/store/${projectId}/product/${productHit.id}`}
            onClick={onSelect}
            className="flex items-center justify-between p-3 hover:bg-accent rounded-md transition-colors"
          >
            <div>
              <div className="font-medium">{productHit.name}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">
                {productHit.description}
              </div>
            </div>
            <div className="font-semibold text-sm whitespace-nowrap ml-4">
              ${((productHit.price || 0) / 100).toFixed(2)}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function LiveSearch({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      className="relative w-full max-w-md mx-4"
      ref={containerRef}
      onClick={() => setOpen(true)}
    >
      <InstantSearch searchClient={searchClient} indexName="products">
        <Configure filters={`projectId:${projectId}`} />

        <CustomSearchBox />

        {open && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-popover text-popover-foreground rounded-md border shadow-md z-50 overflow-hidden">
            <CustomHits projectId={projectId} onSelect={() => setOpen(false)} />
          </div>
        )}
      </InstantSearch>
    </div>
  );
}
