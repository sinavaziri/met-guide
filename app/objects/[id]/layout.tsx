export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const res = await fetch(
      `https://collectionapi.metmuseum.org/public/collection/v1/objects/${params.id}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return { title: 'Artwork — Met Guide' };
    const obj = await res.json();
    const title = obj.title || 'Artwork';
    const artist = obj.artistDisplayName ? ` by ${obj.artistDisplayName}` : '';
    return { title: `${title}${artist} — Met Guide` };
  } catch {
    return { title: 'Artwork — Met Guide' };
  }
}

export default function ObjectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
