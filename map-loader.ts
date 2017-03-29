import * as url from 'url';
import * as shelljs from 'shelljs';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import * as path from 'path';
import * as db from './db';

var httpsWithFollowRedirects = require('follow-redirects').https;

export const QUERY_TABLES_OPENSTREETMAPS = 'select count(1) as qtyTables FROM information_schema.tables WHERE table_schema = \'public\' and table_name like \'planet_osm%\' ';
//export const OSM_FILE_PATH = '/tmp/australia-latest.osm.pbf';
export const OSM_FILE_PATH = '/tmp/map.pbf';

export class MapLoader {
    private dbConfig = db.dbConfig();
    constructor(private filePath: string = OSM_FILE_PATH) {
        console.log(`Initialized MapLoader...\nLoading file ${filePath}\n`);
    }

    async run() {
        let existsFile = await this.checkFile();
        if (!existsFile) {
            let resultDownload = await this.downloadOsmFile();
        }
        existsFile = await this.checkFile();
        if (existsFile) {
            console.log(`File ${this.filePath} exists...\nChecking the database...\n`);
            let existsDB = await this.checkDB();
            let resultLoadDB: boolean;
            if (!existsDB) {
                console.log(`Database was not loaded yet. Loading now...`);
                resultLoadDB = await this.loadDB();
            }
        }
    }

    async downloadOsmFile() {
        return new Promise<boolean>((resolve, reject) => {
            let file = fs.createWriteStream(OSM_FILE_PATH);
            let req: http.ClientRequest = httpsWithFollowRedirects.request(process.env.MAP_URL, function (res: http.ClientResponse) {
                console.log("statusCode: ", res.statusCode);
                console.log("headers: ", res.headers);
                let length = parseInt(res.headers['content-length'], 10);
                let totalBytes = 0;
                let nextPercentToPrint = 5.0;
                if (res.statusCode == 200) {
                    console.log('0% download completed');
                }
                res.on('data', function (d) {
                    file.write(d);
                    totalBytes += d.length;
                    let percent = (100.0 * totalBytes / length);
                    if (percent > nextPercentToPrint) {
                        console.log(`${percent.toFixed(2)} % ...`);
                        nextPercentToPrint =  parseFloat(percent.toFixed(0)) + 5;
                    }
                });
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(true);
                        console.log('Download completed');
                    } else {
                        reject('statusCode = ' + res.statusCode)
                    }
                });
                res.on('error', (err) => {
                    reject(err.message);
                });
            });
            req.end();
        });
    }

    async checkFile(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            fs.exists(this.filePath, (exists) => resolve(exists));
        });
    }

    async checkDB(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            db.connect((error, client) => {
                if (error) {
                    reject(error);
                } else {
                    client.query(QUERY_TABLES_OPENSTREETMAPS, (error, result) => {
                        if(error) {
                            reject(error);
                            return;
                        }
                        let qtyTables = result.rows[0]['qtytables'];
                        console.log(`QTY TABLES: ${qtyTables}`);
                        if (qtyTables > 0) {
                            console.log('Tables OpenStreetMaps already exists')
                            resolve(true);
                        } else {
                            console.error(result.rows);
                            resolve(false);
                        }
                    })
                }
            });
        });
    }

    async loadDB() {
        return new Promise<boolean>((resolve, reject) => {
            shelljs.exec(this.osm2sqlCommandLine(), { async: true }, (code: number, stdout: string, stderr: string) => {
                if (code === 0) {
                    console.log('OSM file exported OK.')
                } else {
                    console.log('Failed to export file');
                }
            })

        });
    }

    private osm2sqlCommandLine() {
        return `export PGPASSWORD=${this.dbConfig.password}; \
        osm2pgsql -H ${this.dbConfig.host} -P ${this.dbConfig.port} -U ${this.dbConfig.user} -d ${this.dbConfig.database} \
         --slim "${this.filePath}"`
    }
}
