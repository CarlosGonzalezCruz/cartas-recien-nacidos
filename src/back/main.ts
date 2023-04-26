import * as properties from './properties.js';
import * as logging from './logging.js';
import * as endpoints from './endpoints.js';

properties.initProperties();
logging.setup();
endpoints.listen(properties.get<number>("Application.port"));