import requests
import time
import random

BASE = "https://collectionapi.metmuseum.org/public/collection/v1"

def met_search_title(title: str, artist: str | None = None, max_retries: int = 3):
    """Search with retry logic for rate limiting."""
    params = {"q": title, "title": "true"}
    
    for attempt in range(max_retries):
        try:
            r = requests.get(f"{BASE}/search", params=params, timeout=30)
            if r.status_code == 403:
                wait = (attempt + 1) * 5 + random.uniform(1, 3)
                print(f"      Rate limited, waiting {wait:.1f}s...")
                time.sleep(wait)
                continue
            r.raise_for_status()
            ids = r.json().get("objectIDs") or []
            if not ids:
                return None

            # If artist provided, pick the first object whose artistDisplayName matches
            for oid in ids[:20]:  # Reduced to avoid too many sub-requests
                time.sleep(0.3)  # Delay between object fetches
                obj_r = requests.get(f"{BASE}/objects/{oid}", timeout=30)
                if obj_r.status_code == 403:
                    time.sleep(3)
                    continue
                obj = obj_r.json()
                if artist and artist.lower() in (obj.get("artistDisplayName","").lower()):
                    return oid
                # Otherwise return first exact-ish title match
                if obj.get("title","").strip().lower() == title.strip().lower():
                    return oid

            # Fallback: first candidate
            return ids[0]
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                time.sleep(3)
                continue
            raise
    return None

items = [
    # Iconic Masterpieces
    {"title": "The Temple of Dendur"},
    {"title": "Washington Crossing the Delaware", "artist": "Emanuel Leutze"},
    {"title": "Madame X (Madame Pierre Gautreau)", "artist": "John Singer Sargent"},
    {"title": "Aristotle with a Bust of Homer", "artist": "Rembrandt"},
    {"title": "The Death of Socrates", "artist": "Jacques Louis David"},
    {"title": "Joan of Arc", "artist": "Jules Bastien-Lepage"},
    {"title": "Self-Portrait with a Straw Hat", "artist": "Vincent van Gogh"},
    {"title": "Cypresses", "artist": "Vincent van Gogh"},
    {"title": "Wheat Field with Cypresses", "artist": "Vincent van Gogh"},
    {"title": "The Gulf Stream", "artist": "Winslow Homer"},
    
    # European Paintings
    {"title": "The Card Players", "artist": "Paul Cézanne"},
    {"title": "Young Woman with a Water Pitcher", "artist": "Johannes Vermeer"},
    {"title": "A Maid Asleep", "artist": "Johannes Vermeer"},
    {"title": "Allegory of the Catholic Faith", "artist": "Johannes Vermeer"},
    {"title": "Study of a Young Woman", "artist": "Johannes Vermeer"},
    {"title": "Woman with a Lute", "artist": "Johannes Vermeer"},
    {"title": "The Harvesters", "artist": "Pieter Bruegel"},
    {"title": "Portrait of a Young Man", "artist": "Bronzino"},
    {"title": "The Musicians", "artist": "Caravaggio"},
    {"title": "The Denial of Saint Peter", "artist": "Caravaggio"},
    
    # More European Masters
    {"title": "Juan de Pareja", "artist": "Diego Velázquez"},
    {"title": "View of Toledo", "artist": "El Greco"},
    {"title": "Portrait of a Cardinal", "artist": "El Greco"},
    {"title": "The Vision of Saint John", "artist": "El Greco"},
    {"title": "The Toilet of Bathsheba", "artist": "Rembrandt"},
    {"title": "Flora", "artist": "Rembrandt"},
    {"title": "Self-Portrait", "artist": "Rembrandt"},
    {"title": "Herman Doomer", "artist": "Rembrandt"},
    {"title": "Hendrickje Stoffels", "artist": "Rembrandt"},
    {"title": "Lucretia", "artist": "Rembrandt"},
    
    # Impressionism
    {"title": "The Dance Class", "artist": "Edgar Degas"},
    {"title": "A Woman Seated beside a Vase of Flowers", "artist": "Edgar Degas"},
    {"title": "The Rehearsal Onstage", "artist": "Edgar Degas"},
    {"title": "Woman with a Parrot", "artist": "Gustave Courbet"},
    {"title": "Boating", "artist": "Édouard Manet"},
    {"title": "The Spanish Singer", "artist": "Édouard Manet"},
    {"title": "Woman Reading", "artist": "Édouard Manet"},
    {"title": "Garden at Sainte-Adresse", "artist": "Claude Monet"},
    {"title": "Bridge over a Pond of Water Lilies", "artist": "Claude Monet"},
    {"title": "Water Lilies", "artist": "Claude Monet"},
    
    # Post-Impressionism & Modern
    {"title": "Mont Sainte-Victoire", "artist": "Paul Cézanne"},
    {"title": "Ia Orana Maria", "artist": "Paul Gauguin"},
    {"title": "Two Tahitian Women", "artist": "Paul Gauguin"},
    {"title": "The Siesta", "artist": "Paul Gauguin"},
    {"title": "Arrangement in Grey and Black", "artist": "James McNeill Whistler"},
    {"title": "Shoes", "artist": "Vincent van Gogh"},
    {"title": "Irises", "artist": "Vincent van Gogh"},
    {"title": "L'Estaque", "artist": "Paul Cézanne"},
    {"title": "Bathers", "artist": "Paul Cézanne"},
    {"title": "Still Life with Apples", "artist": "Paul Cézanne"},
    
    # American Art
    {"title": "Max Schmitt in a Single Scull", "artist": "Thomas Eakins"},
    {"title": "The Rocky Mountains, Lander's Peak", "artist": "Albert Bierstadt"},
    {"title": "The Heart of the Andes", "artist": "Frederic Edwin Church"},
    {"title": "Fur Traders Descending the Missouri", "artist": "George Caleb Bingham"},
    {"title": "The Oxbow", "artist": "Thomas Cole"},
    {"title": "Northeaster", "artist": "Winslow Homer"},
    {"title": "Snap the Whip", "artist": "Winslow Homer"},
    {"title": "The Voyage of Life", "artist": "Thomas Cole"},
    {"title": "Lake George", "artist": "John Frederick Kensett"},
    {"title": "Kindred Spirits", "artist": "Asher Brown Durand"},
    
    # Sculpture & Decorative Arts
    {"title": "Perseus with the Head of Medusa", "artist": "Antonio Canova"},
    {"title": "Ugolino and His Sons", "artist": "Jean-Baptiste Carpeaux"},
    {"title": "The Little Fourteen-Year-Old Dancer", "artist": "Edgar Degas"},
    {"title": "Adam", "artist": "Auguste Rodin"},
    {"title": "The Thinker", "artist": "Auguste Rodin"},
    {"title": "Bust of a Woman", "artist": "Francesco Laurana"},
    {"title": "Armor of Henry II of France"},
    {"title": "The Unicorn in Captivity"},
    {"title": "The Unicorn Defends Itself"},
    {"title": "The Hunters Enter the Woods"},
    
    # Asian Art
    {"title": "Water and Moon Guanyin Bodhisattva"},
    {"title": "Standing Buddha"},
    {"title": "Seated Buddha"},
    {"title": "The Great Wave off Kanagawa", "artist": "Katsushika Hokusai"},
    {"title": "Under the Wave off Kanagawa", "artist": "Katsushika Hokusai"},
    {"title": "Old Plum", "artist": "Kano Sansetsu"},
    {"title": "Night Rain at Karasaki", "artist": "Utagawa Hiroshige"},
    {"title": "Bamboo and Rock"},
    {"title": "Red and White Plum Blossoms"},
    {"title": "Portrait of the Zen Master Zhongfeng Mingben"},
    
    # Egyptian Art
    {"title": "Sphinx of Hatshepsut"},
    {"title": "Seated Statue of Hatshepsut"},
    {"title": "Hippopotamus", "artist": "Egyptian"},
    {"title": "Heart Scarab"},
    {"title": "Canopic Jar"},
    {"title": "Standing Hippopotamus"},
    {"title": "William the Hippo"},
    {"title": "Cult image of the god Ptah"},
    {"title": "Face of Senwosret III"},
    {"title": "Sphinx of Amenhotep III"},
    
    # Greek & Roman Art
    {"title": "Marble statue of a kouros"},
    {"title": "Marble statue of an old woman"},
    {"title": "Bronze statue of a horse"},
    {"title": "Statue of Eros sleeping"},
    {"title": "Marble grave stele of a little girl"},
    {"title": "Terracotta lekythos"},
    {"title": "Terracotta column-krater"},
    {"title": "Marble head of Athena"},
    {"title": "Marble sarcophagus with the contest between the Muses and the Sirens"},
    {"title": "Sleeping Eros"},
]

print("Searching for Met Museum object IDs...")
print("=" * 60)

results = []
for i, it in enumerate(items, 1):
    title = it.get("title", "")
    artist = it.get("artist")
    try:
        oid = met_search_title(title, artist)
        print(f"{i:3}. {title[:50]:50} => {oid}")
        results.append({"title": title, "artist": artist, "objectID": oid})
        time.sleep(0.8)  # Respectful delay between searches
    except Exception as e:
        print(f"{i:3}. {title[:50]:50} => ERROR: {e}")
        results.append({"title": title, "artist": artist, "objectID": None, "error": str(e)})
        time.sleep(2)  # Extra delay after errors

print("=" * 60)
print(f"Found {sum(1 for r in results if r.get('objectID'))} / {len(items)} object IDs")

# Output just the IDs for easy copying
print("\nObject IDs (comma-separated):")
valid_ids = [r["objectID"] for r in results if r.get("objectID")]
print(",".join(str(i) for i in valid_ids))

# Also output as JSON for convenience
import json
print("\nFull results as JSON:")
print(json.dumps(results, indent=2, ensure_ascii=False))
