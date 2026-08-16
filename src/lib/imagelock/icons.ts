import {
  Cat, Dog, Bird, Fish, Rabbit, Squirrel, Snail, Bug, Turtle, Rat,
  Apple, Banana, Cherry, Grape, Carrot, Citrus, Croissant, IceCream, Pizza, Egg,
  Car, Bus, Bike, Plane, Ship, Train, Truck, Rocket, Sailboat, Tractor,
  House, Bed, Lamp, Sofa, DoorOpen, Key, Clock, Scissors, Hammer, Wrench,
  Sun, Moon, Cloud, Star, Trees, Flower, Leaf, Mountain, Snowflake, Umbrella,
  Heart, Phone, Book, Camera, Music, Gift, Anchor, Crown,
  PawPrint, Salad, CarFront, Sofa as SofaIcon, TreePine, Sparkles,
  type LucideIcon,
} from "lucide-react";

export type CategoryId =
  | "animals"
  | "food"
  | "transport"
  | "home"
  | "nature"
  | "things";

export type IconItem = {
  id: string;
  label: string;
  Icon: LucideIcon;
  category: CategoryId;
  /** CSS variable name holding the icon colour token */
  color: string;
};

export type Category = {
  id: CategoryId;
  label: string;
  Icon: LucideIcon;
  color: string;
};

export const CATEGORIES: Category[] = [
  { id: "animals", label: "Animals", Icon: PawPrint, color: "var(--icon-animals)" },
  { id: "food", label: "Food", Icon: Salad, color: "var(--icon-food)" },
  { id: "transport", label: "Vehicles", Icon: CarFront, color: "var(--icon-transport)" },
  { id: "home", label: "Home & Tools", Icon: SofaIcon, color: "var(--icon-home)" },
  { id: "nature", label: "Nature", Icon: TreePine, color: "var(--icon-nature)" },
  { id: "things", label: "Fun Things", Icon: Sparkles, color: "var(--icon-things)" },
];

export const CATEGORY_MAP: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;

function make(
  category: CategoryId,
  items: Array<[string, string, LucideIcon]>,
): IconItem[] {
  const color = CATEGORY_MAP[category].color;
  return items.map(([id, label, Icon]) => ({ id, label, Icon, category, color }));
}

export const ICONS: IconItem[] = [
  ...make("animals", [
    ["cat", "Cat", Cat],
    ["dog", "Dog", Dog],
    ["bird", "Bird", Bird],
    ["fish", "Fish", Fish],
    ["rabbit", "Rabbit", Rabbit],
    ["squirrel", "Squirrel", Squirrel],
    ["snail", "Snail", Snail],
    ["bug", "Bug", Bug],
    ["turtle", "Turtle", Turtle],
    ["rat", "Mouse", Rat],
  ]),
  ...make("food", [
    ["apple", "Apple", Apple],
    ["banana", "Banana", Banana],
    ["cherry", "Cherry", Cherry],
    ["grape", "Grapes", Grape],
    ["carrot", "Carrot", Carrot],
    ["citrus", "Orange", Citrus],
    ["croissant", "Bread", Croissant],
    ["icecream", "Ice cream", IceCream],
    ["pizza", "Pizza", Pizza],
    ["egg", "Egg", Egg],
  ]),
  ...make("transport", [
    ["car", "Car", Car],
    ["bus", "Bus", Bus],
    ["bike", "Bicycle", Bike],
    ["plane", "Plane", Plane],
    ["ship", "Ship", Ship],
    ["train", "Train", Train],
    ["truck", "Truck", Truck],
    ["rocket", "Rocket", Rocket],
    ["sailboat", "Boat", Sailboat],
    ["tractor", "Tractor", Tractor],
  ]),
  ...make("home", [
    ["house", "House", House],
    ["bed", "Bed", Bed],
    ["lamp", "Lamp", Lamp],
    ["sofa", "Sofa", Sofa],
    ["door", "Door", DoorOpen],
    ["key", "Key", Key],
    ["clock", "Clock", Clock],
    ["scissors", "Scissors", Scissors],
    ["hammer", "Hammer", Hammer],
    ["wrench", "Wrench", Wrench],
  ]),
  ...make("nature", [
    ["sun", "Sun", Sun],
    ["moon", "Moon", Moon],
    ["cloud", "Cloud", Cloud],
    ["star", "Star", Star],
    ["tree", "Tree", Trees],
    ["flower", "Flower", Flower],
    ["leaf", "Leaf", Leaf],
    ["mountain", "Mountain", Mountain],
    ["snow", "Snow", Snowflake],
    ["umbrella", "Umbrella", Umbrella],
  ]),
  ...make("things", [
    ["heart", "Heart", Heart],
    ["phone", "Phone", Phone],
    ["book", "Book", Book],
    ["camera", "Camera", Camera],
    ["music", "Music", Music],
    ["gift", "Gift", Gift],
    ["anchor", "Anchor", Anchor],
    ["crown", "Crown", Crown],
  ]),
];

export const ICON_MAP: Record<string, IconItem> = Object.fromEntries(
  ICONS.map((i) => [i.id, i]),
);

export const MIN_SEQUENCE = 4;

/** A sequence must span at least this many different picture groups. */
export const MIN_CATEGORIES = 2;

export function sequenceCategories(sequence: string[]): CategoryId[] {
  const seen = new Set<CategoryId>();
  for (const id of sequence) {
    const item = ICON_MAP[id];
    if (item) seen.add(item.category);
  }
  return [...seen];
}

/** Returns an error message when the sequence breaks a rule, else null. */
export function sequenceError(sequence: string[]): string | null {
  if (sequence.length < MIN_SEQUENCE) {
    return `Pick at least ${MIN_SEQUENCE} pictures.`;
  }
  if (sequenceCategories(sequence).length < MIN_CATEGORIES) {
    return `Use pictures from at least ${MIN_CATEGORIES} different groups.`;
  }
  return null;
}
