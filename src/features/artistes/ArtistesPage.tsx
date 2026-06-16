import { useMemo, useState } from 'react'
import { Mic2, Plus, Printer, Search } from 'lucide-react'
import {
  PageHeader,
  Button,
  Input,
  Select,
  Badge,
  EmptyState,
  ConfirmDialog,
} from '@/components/ui'
import { useArtists, useFestival, useStore } from '@/lib/store'
import { ARTIST_KINDS, ARTIST_STATUS, toOptions } from '@/lib/labels'
import { formatDateFR } from '@/lib/time'
import type { Artist, ArtistKind, ArtistStatus } from '@/lib/types'
import { ArtistCard } from './ArtistCard'
import { ArtistForm } from './ArtistForm'

type StatusFilter = ArtistStatus | 'tous'
type KindFilter = ArtistKind | 'tous'

const STATUS_KEYS = Object.keys(ARTIST_STATUS) as ArtistStatus[]

export function ArtistesPage() {
  const artists = useArtists()
  const festival = useFestival()
  const addArtist = useStore((s) => s.addArtist)
  const updateArtist = useStore((s) => s.updateArtist)
  const removeArtist = useStore((s) => s.removeArtist)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('tous')
  const [kindFilter, setKindFilter] = useState<KindFilter>('tous')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Artist | undefined>(undefined)
  const [toDelete, setToDelete] = useState<Artist | null>(null)

  // Compteurs par statut (sur l'ensemble des artistes, hors filtre).
  const counts = useMemo(() => {
    const acc = { pressenti: 0, contacte: 0, confirme: 0, desiste: 0 } as Record<ArtistStatus, number>
    for (const a of artists) acc[a.status]++
    return acc
  }, [artists])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return artists.filter((a) => {
      if (statusFilter !== 'tous' && a.status !== statusFilter) return false
      if (kindFilter !== 'tous' && a.kind !== kindFilter) return false
      if (q && !a.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [artists, query, statusFilter, kindFilter])

  const statusOptions = [{ value: 'tous', label: 'Tous les statuts' }, ...toOptions(ARTIST_STATUS)]
  const kindOptions = [{ value: 'tous', label: 'Tous les types' }, ...toOptions(ARTIST_KINDS)]

  const openCreate = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  const openEdit = (artist: Artist) => {
    setEditing(artist)
    setFormOpen(true)
  }

  const handleSubmit = (values: Artist) => {
    // On ne propage jamais les métadonnées (id/timestamps) : le store les gère.
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = values
    if (editing) updateArtist(editing.id, payload)
    else addArtist(payload)
    setFormOpen(false)
    setEditing(undefined)
  }

  const confirmDelete = () => {
    if (toDelete) removeArtist(toDelete.id)
    setToDelete(null)
  }

  const hasArtists = artists.length > 0

  return (
    <div>
      {/* En-tête imprimé : identifie la liste. */}
      <div className="mb-4 hidden border-b border-night-700 pb-3 print:block">
        <h1 className="font-display text-2xl font-bold text-white">
          Artistes — {festival.name} {festival.edition}
        </h1>
        <p className="mt-0.5 text-sm text-slate-400">
          {festival.date ? formatDateFR(festival.date) : ''}
        </p>
      </div>

      <PageHeader
        title="Artistes"
        subtitle="Gestion des artistes, groupes et de leurs besoins techniques."
        actions={
          <div className="no-print flex flex-wrap items-center gap-2">
            {hasArtists && (
              <Button variant="outline" onClick={() => window.print()}>
                <Printer size={18} />
                Imprimer
              </Button>
            )}
            <Button onClick={openCreate}>
              <Plus size={18} />
              Ajouter un artiste
            </Button>
          </div>
        }
      />

      {hasArtists && (
        <>
          {/* Barre d'outils : recherche + filtres (masquée à l'impression) */}
          <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <Input
                className="pl-9"
                type="search"
                value={query}
                placeholder="Rechercher un artiste…"
                aria-label="Rechercher un artiste par nom"
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select
              className="sm:w-48"
              options={statusOptions}
              value={statusFilter}
              aria-label="Filtrer par statut"
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            />
            <Select
              className="sm:w-44"
              options={kindOptions}
              value={kindFilter}
              aria-label="Filtrer par type"
              onChange={(e) => setKindFilter(e.target.value as KindFilter)}
            />
          </div>

          {/* Compteurs par statut */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {STATUS_KEYS.map((key) => (
              <Badge key={key} tone={ARTIST_STATUS[key].badge}>
                {counts[key]} {ARTIST_STATUS[key].label.toLowerCase()}
                {counts[key] > 1 ? 's' : ''}
              </Badge>
            ))}
          </div>
        </>
      )}

      {/* Contenu */}
      {!hasArtists ? (
        <EmptyState
          icon={Mic2}
          title="Aucun artiste"
          description="Ajoutez les groupes et artistes du festival pour suivre leurs besoins."
          action={
            <Button onClick={openCreate}>
              <Plus size={18} />
              Ajouter un artiste
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Aucun résultat"
          description="Aucun artiste ne correspond à votre recherche ou à vos filtres."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((artist) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              onEdit={openEdit}
              onDelete={setToDelete}
              onStatusChange={(id, status) => updateArtist(id, { status })}
            />
          ))}
        </div>
      )}

      <ArtistForm
        open={formOpen}
        artist={editing}
        onClose={() => {
          setFormOpen(false)
          setEditing(undefined)
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title="Supprimer l'artiste"
        message={
          toDelete
            ? `Supprimer « ${toDelete.name} » ? Les créneaux du conducteur liés à cet artiste seront déliés.`
            : ''
        }
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
