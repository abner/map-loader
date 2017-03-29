import { MapLoader } from './map-loader';

let loader = new MapLoader();

loader.run().then((result) => {
    console.info('Map load finished succcessfully!');
    process.exit(0);
},
(error) => {
    console.error('Map load failed! ', error);
    process.exit(-1);
}).catch(error => console.error(error));

