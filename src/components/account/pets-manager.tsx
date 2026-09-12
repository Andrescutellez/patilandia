"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  createPetProfile,
  deletePetProfile,
  getMyPetProfiles,
  getStoredAccountEmail,
  storeAccountEmail,
  updatePetProfile,
  type PetProfile,
  type PetProfileInput,
  type PetSize,
  type PetSpecies
} from "@/lib/vendure/pets-client";

const speciesLabels: Record<PetSpecies, string> = { dog: "Perro", cat: "Gato", other: "Otra" };
const sizeLabels: Record<Exclude<PetSize, "">, string> = {
  pequeno: "Pequeño",
  mediano: "Mediano",
  grande: "Grande"
};

const emptyForm: PetProfileInput = { name: "", species: "dog", breed: "", birthDate: "", sizeLabel: "", notes: "" };

function EmailGate({ onSubmit }: { onSubmit: (email: string) => void }) {
  const [email, setEmail] = useState("");

  return (
    <form
      className="mx-auto max-w-md space-y-4 rounded-[2rem] border border-white/60 bg-white/84 p-6 text-center shadow-[0_20px_50px_rgba(31,36,84,0.08)]"
      onSubmit={(event) => {
        event.preventDefault();
        if (email.trim()) {
          onSubmit(email.trim());
        }
      }}
    >
      <h1 className="font-display text-3xl leading-none text-[var(--ink)]">Tus mascotas</h1>
      <p className="text-sm text-[var(--muted)]">
        Ingresá tu correo para ver o cargar el perfil de tus mascotas. Todavía no manejamos cuentas con
        contraseña, así que usamos tu correo para identificarte, igual que en el carrito.
      </p>
      <input
        className="w-full rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="tu@correo.com"
        required
        type="email"
        value={email}
      />
      <Button className="w-full" type="submit">
        Continuar
      </Button>
    </form>
  );
}

function PetForm({
  initial,
  onCancel,
  onSave
}: {
  initial?: PetProfile;
  onCancel: () => void;
  onSave: (input: PetProfileInput) => Promise<void>;
}) {
  const [form, setForm] = useState<PetProfileInput>(
    initial
      ? {
          name: initial.name,
          species: initial.species,
          breed: initial.breed,
          birthDate: initial.birthDate?.slice(0, 10) ?? "",
          sizeLabel: initial.sizeLabel,
          notes: initial.notes
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la mascota.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="space-y-4 rounded-[1.4rem] border border-[var(--line)] bg-white p-5"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
          onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
          placeholder="Nombre de tu mascota"
          required
          type="text"
          value={form.name}
        />
        <select
          className="rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
          onChange={(event) => setForm((f) => ({ ...f, species: event.target.value as PetSpecies }))}
          value={form.species}
        >
          {(Object.keys(speciesLabels) as PetSpecies[]).map((value) => (
            <option key={value} value={value}>
              {speciesLabels[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <input
          className="rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
          onChange={(event) => setForm((f) => ({ ...f, breed: event.target.value }))}
          placeholder="Raza (opcional)"
          type="text"
          value={form.breed}
        />
        <select
          className="rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
          onChange={(event) => setForm((f) => ({ ...f, sizeLabel: event.target.value as PetSize }))}
          value={form.sizeLabel}
        >
          <option value="">Tamaño (opcional)</option>
          {(Object.keys(sizeLabels) as Array<Exclude<PetSize, "">>).map((value) => (
            <option key={value} value={value}>
              {sizeLabels[value]}
            </option>
          ))}
        </select>
        <input
          className="rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
          onChange={(event) => setForm((f) => ({ ...f, birthDate: event.target.value }))}
          type="date"
          value={form.birthDate}
        />
      </div>

      <textarea
        className="w-full rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
        onChange={(event) => setForm((f) => ({ ...f, notes: event.target.value }))}
        placeholder="Preferencias, alergias, lo que quieras recordar (opcional)"
        rows={3}
        value={form.notes}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex gap-3">
        <Button disabled={saving} type="submit">
          {saving ? "Guardando…" : "Guardar"}
        </Button>
        <Button onClick={onCancel} type="button" variant="ghost">
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function PetsList({ email }: { email: string }) {
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const items = await getMyPetProfiles(email);
    setPets(items);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  async function handleCreate(input: PetProfileInput) {
    await createPetProfile(email, input);
    setShowForm(false);
    await load();
  }

  async function handleUpdate(id: string, input: PetProfileInput) {
    await updatePetProfile(email, id, input);
    setEditingId(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar este perfil de mascota?")) {
      return;
    }
    await deletePetProfile(email, id);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl leading-none text-[var(--ink)]">Tus mascotas</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Sesión iniciada como {email}</p>
        </div>
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} type="button">
            Agregar mascota
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <PetForm onCancel={() => setShowForm(false)} onSave={handleCreate} />
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Cargando…</p>
      ) : pets.length === 0 && !showForm ? (
        <p className="rounded-[1.4rem] bg-[var(--brand-soft)] p-6 text-sm text-[var(--muted)]">
          Todavía no cargaste ninguna mascota. Agregá la primera para empezar a recibir recomendaciones a
          su medida.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {pets.map((pet) =>
            editingId === pet.id ? (
              <li className="sm:col-span-2" key={pet.id}>
                <PetForm
                  initial={pet}
                  onCancel={() => setEditingId(null)}
                  onSave={(input) => handleUpdate(pet.id, input)}
                />
              </li>
            ) : (
              <li className="rounded-[1.4rem] border border-white/60 bg-white/84 p-5" key={pet.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl leading-none text-[var(--ink)]">{pet.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {speciesLabels[pet.species]}
                      {pet.breed ? ` · ${pet.breed}` : ""}
                      {pet.sizeLabel ? ` · ${sizeLabels[pet.sizeLabel]}` : ""}
                    </p>
                  </div>
                </div>
                {pet.notes ? <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{pet.notes}</p> : null}
                <div className="mt-4 flex gap-3">
                  <Button onClick={() => setEditingId(pet.id)} size="sm" type="button" variant="secondary">
                    Editar
                  </Button>
                  <Button onClick={() => handleDelete(pet.id)} size="sm" type="button" variant="ghost">
                    Eliminar
                  </Button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

export function PetsManager() {
  const [email, setEmail] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEmail(getStoredAccountEmail());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return null;
  }

  if (!email) {
    return (
      <EmailGate
        onSubmit={(value) => {
          storeAccountEmail(value);
          setEmail(value);
        }}
      />
    );
  }

  return <PetsList email={email} />;
}
