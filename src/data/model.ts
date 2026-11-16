import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import family from './family.json';
import { sections } from './site';

export type Person = {
  id: string;
  name: string;
  birth?: string;
  death?: string;
  portrait?: { path: string; width: number; height: number };
};

export type FamilyNode = {
  people: Person[];
  children: FamilyNode[];
};

type Page = CollectionEntry<'pages'>;

export function pagePath({ data }: Page) {
  const prefix = data.kind === 'person' ? '' : `${sections[data.kind].id}/`;
  return `${prefix}${data.slug}/`;
}

export async function loadArchive() {
  const people = new Map<string, Person>(family.people.map(person => [person.id, person]));
  if (people.size !== family.people.length) throw new Error('Duplicate person ID');

  const getPerson = (id: string) => {
    const person = people.get(id);
    if (!person) throw new Error(`Unknown person: ${id}`);
    return person;
  };

  const unions = new Map(family.unions.map(union => [union.partners[0], union]));
  if (unions.size !== family.unions.length) throw new Error('Duplicate lead person in family unions');
  const placed = new Set<string>();

  function buildBranch(id: string): FamilyNode {
    const union = unions.get(id);
    const members = (union?.partners ?? [id]).map(member => {
      if (placed.has(member)) throw new Error(`Person occurs twice in the displayed tree: ${member}`);
      placed.add(member);
      return getPerson(member);
    });
    return { people: members, children: (union?.children ?? []).map(buildBranch) };
  }

  const tree = buildBranch(family.root);
  if (placed.size !== people.size || [...unions.keys()].some(id => !placed.has(id))) {
    throw new Error('Family contains people or unions outside the tree');
  }

  const pages = await getCollection('pages', ({ data }) => data.published);
  const profiles = new Map<string, Page>();
  const paths = new Set<string>();

  for (const page of pages) {
    const path = pagePath(page).toLowerCase();
    if (paths.has(path) || ['test/', 'draftversion/'].includes(path)) {
      throw new Error(`Conflicting page URL: ${path}`);
    }
    paths.add(path);

    if (page.data.kind === 'person') {
      const { person } = page.data;
      getPerson(person);
      if (profiles.has(person)) throw new Error(`Duplicate profile: ${person}`);
      profiles.set(person, page);
    } else {
      page.data.people.forEach(getPerson);
    }
  }

  return { tree, getPerson, pages, profiles };
}
