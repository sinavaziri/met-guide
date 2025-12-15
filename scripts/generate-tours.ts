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

// Maximum objects per department tour
const MAX_OBJECTS_PER_DEPARTMENT = 30;

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

interface MetDepartment {
  departmentId: number;
  displayName: string;
}

interface MetDepartmentsResponse {
  departments: MetDepartment[];
}

interface MetSearchResponse {
  total: number;
  objectIDs: number[] | null;
}

// Department icons mapping
const DEPARTMENT_ICONS: Record<number, string> = {
  1: '🏺',   // American Decorative Arts
  3: '🏛️',   // Ancient Near Eastern Art
  4: '⚔️',   // Arms and Armor
  5: '🎭',   // Arts of Africa, Oceania, and the Americas
  6: '🐉',   // Asian Art
  7: '⛪',   // The Cloisters
  8: '👗',   // The Costume Institute
  9: '✏️',   // Drawings and Prints
  10: '🏺',  // Egyptian Art
  11: '🖼️',  // European Paintings
  12: '🗿',  // European Sculpture and Decorative Arts
  13: '🏛️',  // Greek and Roman Art
  14: '☪️',  // Islamic Art
  15: '📜',  // Robert Lehman Collection
  16: '📸',  // The Libraries
  17: '⚱️',  // Medieval Art
  18: '🎹',  // Musical Instruments
  19: '📷',  // Photographs
  21: '🖌️',  // Modern and Contemporary Art
};

// Department descriptions
const DEPARTMENT_DESCRIPTIONS: Record<number, string> = {
  1: 'Furniture, silver, ceramics, and decorative arts from colonial America to the early 20th century',
  3: 'Artifacts from Mesopotamia, Anatolia, and the ancient Near East',
  4: 'Weapons, armor, and military equipment from around the world',
  5: 'Art and artifacts from sub-Saharan Africa, the Pacific Islands, and the Americas',
  6: 'Paintings, sculptures, ceramics, and textiles from China, Japan, Korea, South and Southeast Asia',
  7: 'Medieval European art and architecture in a branch museum in Fort Tryon Park',
  8: 'Fashion and accessories from the 15th century to the present',
  9: 'Works on paper including prints, drawings, and illustrated books',
  10: 'Art from ancient Egypt spanning 5,000 years of history',
  11: 'Masterpieces of European painting from the 13th to the early 20th century',
  12: 'Sculpture, furniture, ceramics, and metalwork from Renaissance to early modern Europe',
  13: 'Art from ancient Greece and Rome, including sculpture, pottery, and jewelry',
  14: 'Art from the Islamic world spanning 13 centuries',
  15: 'Old Master and Impressionist paintings from the Robert Lehman Collection',
  17: 'Art and artifacts from medieval Europe',
  18: 'Musical instruments from around the world and across history',
  19: 'Photographs from the invention of the medium to the present',
  21: 'Art from the late 19th century to today',
};

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

async function fetchDepartments(): Promise<MetDepartment[]> {
  console.log('🏛️ Fetching departments...');
  const response = await fetchWithRetry(`${MET_API_BASE}/departments`);
  const data: MetDepartmentsResponse = await response.json();
  console.log(`   Found ${data.departments.length} departments`);
  return data.departments;
}

async function searchDepartmentHighlights(departmentId: number): Promise<number[]> {
  const url = `${MET_API_BASE}/search?departmentId=${departmentId}&isHighlight=true&hasImages=true&q=*`;
  try {
    const response = await fetchWithRetry(url);
    const data: MetSearchResponse = await response.json();
    return data.objectIDs || [];
  } catch (error) {
    console.log(`   ⚠️ Failed to search department ${departmentId}`);
    return [];
  }
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
    
    // Rate limiting
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

async function generateDepartmentTour(department: MetDepartment): Promise<Tour | null> {
  console.log(`\n🏛️ Generating tour for ${department.displayName}...`);
  
  // Search for highlights in this department
  const objectIds = await searchDepartmentHighlights(department.departmentId);
  
  if (objectIds.length === 0) {
    console.log(`   ⚠️ No highlights found, skipping...`);
    return null;
  }
  
  console.log(`   Found ${objectIds.length} highlight objects`);
  
  // Limit to max objects
  const limitedIds = objectIds.slice(0, MAX_OBJECTS_PER_DEPARTMENT);
  
  const objects: TourObject[] = [];
  
  for (let i = 0; i < limitedIds.length; i++) {
    const objectId = limitedIds[i];
    
    const obj = await fetchObject(objectId);
    
    if (obj && isValidTourObject(obj)) {
      objects.push(transformToTourObject(obj));
    }
    
    // Rate limiting
    await delay(100);
  }
  
  if (objects.length === 0) {
    console.log(`   ⚠️ No valid objects found, skipping...`);
    return null;
  }
  
  console.log(`   ✅ Collected ${objects.length} valid objects`);
  
  // Create a URL-friendly ID
  const tourId = `dept-${department.departmentId}`;
  
  return {
    id: tourId,
    name: department.displayName,
    description: DEPARTMENT_DESCRIPTIONS[department.departmentId] || `Explore the ${department.displayName} collection`,
    icon: DEPARTMENT_ICONS[department.departmentId] || '🎨',
    objectCount: objects.length,
    objects,
  };
}

async function main() {
  console.log('🏛️ Met Guide Tour Generator\n');
  console.log('================================\n');
  
  try {
    const tours: Tour[] = [];
    
    // Generate highlights tour
    const highlightIds = getCuratedHighlightIds();
    
    if (highlightIds.length === 0) {
      console.error('❌ No highlights found!');
      process.exit(1);
    }
    
    const highlightsTour = await generateHighlightsTour(highlightIds);
    tours.push(highlightsTour);
    
    // Generate department tours
    const departments = await fetchDepartments();
    
    // Filter out departments we want to include (skip Libraries, etc.)
    const includedDepartments = departments.filter(d => 
      d.departmentId !== 16 // Skip Libraries
    );
    
    for (const department of includedDepartments) {
      const tour = await generateDepartmentTour(department);
      if (tour && tour.objects.length >= 5) { // Only include if at least 5 objects
        tours.push(tour);
      }
    }
    
    // Sort department tours alphabetically (after highlights)
    const [highlights, ...deptTours] = tours;
    deptTours.sort((a, b) => a.name.localeCompare(b.name));
    
    // Create the tours data structure
    const toursData: ToursData = {
      generatedAt: new Date().toISOString(),
      tours: [highlights, ...deptTours],
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
    console.log(`   🗂️ Total tours: ${tours.length}`);
    console.log(`   🎨 Total objects: ${tours.reduce((sum, t) => sum + t.objectCount, 0)}`);
    
  } catch (error) {
    console.error('❌ Error generating tours:', error);
    process.exit(1);
  }
}

main();
