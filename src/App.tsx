import { useState } from "react";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useGarden } from "./store";
import { LocationPanel } from "./components/LocationPanel";
import { PlantCatalog } from "./components/PlantCatalog";
import { BedView, AddBedForm } from "./components/BedCanvas";
import { IssuesPanel } from "./components/IssuesPanel";
import { CalendarView } from "./components/CalendarView";
import { ZONE_BY_ID } from "./data/zones";

type Tab = "garden" | "plants" | "calendar" | "location";

function Header() {
  const gardenName = useGarden((s) => s.gardenName);
  const setGardenName = useGarden((s) => s.setGardenName);
  const location = useGarden((s) => s.location);
  const zone = location.usdaZone ? ZONE_BY_ID.get(location.usdaZone) : null;

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="text-xl">🌱</span>
          <input
            value={gardenName}
            onChange={(e) => setGardenName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-b border-transparent hover:border-stone-300 focus:border-leaf-500 outline-none min-w-0"
          />
        </div>
        <div className="text-xs text-stone-600 text-right whitespace-nowrap">
          {location.label && <div>{location.label}</div>}
          {zone && (
            <div>
              Zone {zone.zone} · last frost {zone.lastFrost} · first frost{" "}
              {zone.firstFrost}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function TabBar({
  active,
  onSelect,
}: {
  active: Tab;
  onSelect: (t: Tab) => void;
}) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "garden", label: "Garden" },
    { id: "plants", label: "Plant catalog" },
    { id: "calendar", label: "Calendar" },
    { id: "location", label: "Location" },
  ];
  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px ${
              active === t.id
                ? "border-leaf-600 text-leaf-700 font-medium"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function GardenView() {
  const beds = useGarden((s) => s.beds);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      <div className="space-y-4">
        {beds.length === 0 && (
          <div className="rounded-lg border border-stone-200 bg-white p-6 text-center text-stone-500 text-sm">
            No beds yet. Add one below to start planning.
          </div>
        )}
        {beds.map((bed) => (
          <BedView key={bed.id} bed={bed} />
        ))}
        <AddBedForm />
      </div>
      <aside className="space-y-4">
        <section className="rounded-lg border border-stone-200 bg-white p-3">
          <h3 className="font-semibold text-sm mb-2">Plants</h3>
          <p className="text-xs text-stone-500 mb-2">
            Drag a plant onto a bed cell to plant it. Right-click a plant to remove it.
          </p>
          <PlantCatalog />
        </section>
        <section className="rounded-lg border border-stone-200 bg-white p-3">
          <h3 className="font-semibold text-sm mb-2">Companion analysis</h3>
          <IssuesPanel />
        </section>
      </aside>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("garden");
  const placePlant = useGarden((s) => s.placePlant);
  const movePlacement = useGarden((s) => s.movePlacement);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const cell = over.data.current as
      | { bedId: string; row: number; col: number }
      | undefined;
    if (!cell) return;
    const src = active.data.current as
      | { source: "catalog"; plantId: string }
      | { source: "placement"; placementId: string }
      | undefined;
    if (!src) return;
    if (src.source === "catalog") {
      placePlant(cell.bedId, src.plantId, cell.row, cell.col);
    } else {
      movePlacement(src.placementId, cell.bedId, cell.row, cell.col);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="min-h-full flex flex-col">
        <Header />
        <TabBar active={tab} onSelect={setTab} />
        <main className="max-w-6xl w-full mx-auto p-4 flex-1">
          {tab === "garden" && <GardenView />}
          {tab === "plants" && (
            <div className="max-w-md">
              <PlantCatalog />
            </div>
          )}
          {tab === "calendar" && (
            <div className="max-w-4xl">
              <CalendarView />
            </div>
          )}
          {tab === "location" && (
            <div className="max-w-2xl">
              <LocationPanel />
            </div>
          )}
        </main>
        <footer className="text-center text-xs text-stone-500 py-3">
          Local-only · data stored in your browser
        </footer>
      </div>
    </DndContext>
  );
}
