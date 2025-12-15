/**
 * Tour Generation Script
 * 
 * Fetches highlight objects from the Met API and generates
 * a curated tours.json file for the app to serve.
 * 
 * Run with: npm run generate-tours
 */

import * as fs from 'fs';
import * as path from 'path';
import { MET_HIGHLIGHT_IDS } from '../data/met_highlights';

const MET_API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

interface MetObject {
  objectID: number;
  title: string;
  artistDisplayName: string;
  artistDisplayBio: string;
  objectDate: string;
  medium: string;
  department: string;
  culture: string;
  period: string;
  classification: string;
  primaryImage: string;
  primaryImageSmall: string;
  isHighlight: boolean;
  isPublicDomain: boolean;
}

interface TourObject {
  objectID: number;
  title: string;
  artistDisplayName: string | null;
  artistDisplayBio: string | null;
  objectDate: string | null;
  department: string;
  primaryImageSmall: string;
  isHighlight: boolean;
}

interface Tour {
  id: string;
  name: string;
  description: string;
  icon: string;
  objectCount: number;
  objects: TourObject[];
}

interface ToursData {
  generatedAt: string;
  tours: Tour[];
}

// Rate limiting helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      if (response.status === 429) {
        console.log(`Rate limited, waiting ${(i + 1) * 2} seconds...`);
        await delay((i + 1) * 2000);
        continue;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(1000);
    }
  }
  throw new Error('Max retries reached');
}

function getCuratedHighlightIds(): number[] {
  console.log('🔍 Loading curated highlight objects...');
  console.log(`   Found ${MET_HIGHLIGHT_IDS.length} curated objects`);
  return MET_HIGHLIGHT_IDS;
}

async function fetchObject(objectId: number): Promise<MetObject | null> {
  try {
    const response = await fetchWithRetry(`${MET_API_BASE}/objects/${objectId}`);
    return await response.json();
  } catch (error) {
    console.log(`   ⚠️ Failed to fetch object ${objectId}`);
    return null;
  }
}

function isValidTourObject(obj: MetObject): boolean {
  // Must have an image
  if (!obj.primaryImageSmall && !obj.primaryImage) return false;
  
  // Must have a title
  if (!obj.title || obj.title.trim() === '') return false;
  
  // Must have a department
  if (!obj.department) return false;
  
  // Prefer objects with artist info, but don't require it
  // (many ancient artifacts won't have artist names)
  
  return true;
}

function transformToTourObject(obj: MetObject): TourObject {
  return {
    objectID: obj.objectID,
    title: obj.title,
    artistDisplayName: obj.artistDisplayName || null,
    artistDisplayBio: obj.artistDisplayBio || null,
    objectDate: obj.objectDate || null,
    department: obj.department,
    primaryImageSmall: obj.primaryImageSmall || obj.primaryImage,
    isHighlight: obj.isHighlight,
  };
}

async function generateHighlightsTour(objectIds: number[]): Promise<Tour> {
  console.log('\n🎨 Generating Highlights Tour...');
  
  const objects: TourObject[] = [];
  
  for (let i = 0; i < objectIds.length; i++) {
    const objectId = objectIds[i];
    
    // Progress indicator
    if ((i + 1) % 10 === 0) {
      console.log(`   Processing ${i + 1}/${objectIds.length}...`);
    }
    
    const obj = await fetchObject(objectId);
    
    if (obj && isValidTourObject(obj)) {
      objects.push(transformToTourObject(obj));
    }
    
    // Rate limiting: Met API is fairly generous but let's be nice
    await delay(100);
  }
  
  console.log(`   ✅ Collected ${objects.length} valid objects`);
  
  return {
    id: 'highlights',
    name: 'Museum Highlights',
    description: 'Hand-picked masterpieces spanning European paintings, American art, sculpture, medieval treasures, Asian art, and ancient artifacts',
    icon: '⭐',
    objectCount: objects.length,
    objects,
  };
}

async function main() {
  console.log('🏛️ Met Guide Tour Generator\n');
  console.log('================================\n');
  
  try {
    // Load curated highlight IDs
    const highlightIds = getCuratedHighlightIds();
    
    if (highlightIds.length === 0) {
      console.error('❌ No highlights found!');
      process.exit(1);
    }
    
    // Generate the highlights tour
    const highlightsTour = await generateHighlightsTour(highlightIds);
    
    // Create the tours data structure
    const toursData: ToursData = {
      generatedAt: new Date().toISOString(),
      tours: [highlightsTour],
    };
    
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write to file
    const outputPath = path.join(dataDir, 'tours.json');
    fs.writeFileSync(outputPath, JSON.stringify(toursData, null, 2));
    
    // Calculate file size
    const stats = fs.statSync(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(1);
    
    console.log('\n================================');
    console.log('✅ Tour generation complete!');
    console.log(`   📁 Output: ${outputPath}`);
    console.log(`   📊 File size: ${fileSizeKB} KB`);
    console.log(`   🎨 Total objects: ${highlightsTour.objects.length}`);
    
  } catch (error) {
    console.error('❌ Error generating tours:', error);
    process.exit(1);
  }
}

main();

