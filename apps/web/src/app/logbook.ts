import { createLogbook } from '@cq-talk/storage';

/** The app's QSL log (IndexedDB), shared by every page. */
export const logbook = createLogbook();
