import * as properties from './properties.js';
import * as endpoints from './endpoints.js';

properties.initProperties();
endpoints.listen(properties.get<number>("Application.port"));