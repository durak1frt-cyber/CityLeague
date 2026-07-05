import {
  MOCK_PROFILES,
  MOCK_TEAMS,
  MOCK_TEAM_MEMBERS,
  MOCK_TOURNAMENTS,
  MOCK_TOURNAMENT_TEAMS,
  MOCK_VENUES,
  MOCK_MATCHES,
  MOCK_MATCH_EVENTS,
  MOCK_PLAYER_MATCH_STATS,
  MOCK_FEED_EVENTS,
  MOCK_NOTIFICATIONS,
  MOCK_COACHING_DRILLS,
  MOCK_PLAYER_DRILLS,
  MOCK_RECRUITMENT_LISTINGS,
  MOCK_RECRUITMENT_REQUESTS,
  MOCK_JERSEY_ORDERS,
  MOCK_JERSEY_ORDER_ITEMS
} from './mock-data';

const DB_FILE = ".gemini-db.json";

function getInitialDb() {
  return {
    profiles: MOCK_PROFILES,
    teams: MOCK_TEAMS,
    team_members: MOCK_TEAM_MEMBERS,
    tournaments: MOCK_TOURNAMENTS,
    tournament_teams: MOCK_TOURNAMENT_TEAMS,
    venues: MOCK_VENUES,
    matches: MOCK_MATCHES,
    match_events: MOCK_MATCH_EVENTS,
    player_match_stats: MOCK_PLAYER_MATCH_STATS,
    feed_events: MOCK_FEED_EVENTS,
    notifications: MOCK_NOTIFICATIONS,
    coaching_drills: MOCK_COACHING_DRILLS,
    player_drills: MOCK_PLAYER_DRILLS,
    recruitment_listings: MOCK_RECRUITMENT_LISTINGS,
    recruitment_requests: MOCK_RECRUITMENT_REQUESTS,
    jersey_orders: MOCK_JERSEY_ORDERS,
    jersey_order_items: MOCK_JERSEY_ORDER_ITEMS
  };
}

let fs: any = null;
let path: any = null;
let serverMemoryDb: any = null;

if (typeof window === 'undefined') {
  try {
    fs = require('fs');
    path = require('path');
  } catch (e) {}
}

export function readDb(): any {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('city_league_db');
    if (data) {
      return JSON.parse(data);
    }
    const initial = getInitialDb();
    localStorage.setItem('city_league_db', JSON.stringify(initial));
    return initial;
  } else {
    try {
      if (fs && path) {
        const filePath = path.resolve(process.cwd(), DB_FILE);
        if (fs.existsSync(filePath)) {
          return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
      }
    } catch (e) {}
    if (serverMemoryDb) return serverMemoryDb;
    serverMemoryDb = getInitialDb();
    try {
      if (fs && path) {
        const filePath = path.resolve(process.cwd(), DB_FILE);
        fs.writeFileSync(filePath, JSON.stringify(serverMemoryDb, null, 2), 'utf-8');
      }
    } catch (e) {}
    return serverMemoryDb;
  }
}

export function writeDb(data: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('city_league_db', JSON.stringify(data));
    window.dispatchEvent(new Event('storage'));
  } else {
    serverMemoryDb = data;
    try {
      if (fs && path) {
        const filePath = path.resolve(process.cwd(), DB_FILE);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      }
    } catch (e) {}
  }
}

export function getItems<T = any>(table: string): T[] {
  const db = readDb();
  return (db[table] || []) as T[];
}

export function getItem<T = any>(table: string, id: string): T | undefined {
  const items = getItems<any>(table);
  return items.find(item => item.id === id);
}

export function insertItem<T = any>(table: string, item: any): T {
  const db = readDb();
  if (!db[table]) db[table] = [];
  const newItem = {
    id: item.id || `${table}-${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    ...item
  };
  db[table].push(newItem);
  writeDb(db);
  return newItem as T;
}

export function updateItem<T = any>(table: string, id: string, updates: any): T | undefined {
  const db = readDb();
  const items = db[table] || [];
  const index = items.findIndex((item: any) => item.id === id);
  if (index === -1) return undefined;
  
  const updatedItem = {
    ...items[index],
    ...updates,
    updated_at: new Date().toISOString()
  };
  db[table][index] = updatedItem;
  writeDb(db);
  return updatedItem as T;
}

export function deleteItem(table: string, id: string): boolean {
  const db = readDb();
  const items = db[table] || [];
  const initialLength = items.length;
  db[table] = items.filter((item: any) => item.id !== id);
  writeDb(db);
  return db[table].length < initialLength;
}
