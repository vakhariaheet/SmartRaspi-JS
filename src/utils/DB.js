import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync.js';

class DB {
    constructor(db) {
        this.db = db;
    }

    getUser() {
        return this.db.get('user').value();
    }

    async setUser(user) {
        await this.db.set('user', user).write();
    }

    getCurrentProcessId() {
        return this.db.get('currentProcessId').value();
    }

    async setCurrentProcessId(processId) {
        await this.db.set('currentProcessId', processId).write();
    }

    getGPS() {
        return this.db.get('gps').value();
    }

    async setGPS(gps) {
        await this.db.set('gps', gps).write();
    }
}

const getDB = async () => {
    const db = await low(new FileSync('db.json'));

    // Set defaults - this replaces the TypeScript interface structure
    db.defaults({
        user: null,
        currentProcessId: null,
        gps: null
    }).write();

    return new DB(db);
};

// Example schema documentation for reference (optional)
/*
Database Schema:
{
    user: {
        id: string,
        name: string
    } | null,
    currentProcessId: number | null,
    gps: {
        origin: {
            lat: number,
            lng: number
        },
        destination: {
            lat: number,
            lng: number
        },
        destinationPlaceId: string,
        destinationName: string,
        distance: number,
        steps: [{
            distance: {
                text: string,
                value: number
            },
            duration: {
                text: string,
                value: number
            },
            end_location: {
                lat: number,
                lng: number
            },
            start_location: {
                lat: number,
                lng: number
            },
            html_instructions: string,
            travel_mode: string,
            maneuver: string,
            polyline: {
                points: string
            }
        }],
        currentLocation: {
            lat: number,
            lng: number
        },
        currentStepIndex: number,
        isConfirmed: boolean
    } | null
}
*/

export default getDB;