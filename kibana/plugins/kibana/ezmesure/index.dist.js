import { resolve } from 'path';
import { existsSync } from 'fs';

import api from './server/routes';

export default function (kibana) {

  const ezmesureLink = '{{EZMESURE_URL}}';

  return new kibana.Plugin({
    name: 'ezmesure',

    require: ['kibana', 'elasticsearch'],

    uiExports: {
      links: [
        {
          id: 'ezmesure:home',
          title: 'ezMESURE',
          order: -1005,
          url: ezmesureLink,
          euiIconType: 'editorUndo',
          description: 'ezMESURE',
        },
      ],

      app: {
        title: 'Reporting',
        description: 'Reporting',
        main: 'plugins/ezmesure/app',
        euiIconType: 'reportingApp',
        order: -1004,
      },

      hacks: [
        'plugins/ezmesure/hack',
      ],

      styleSheetPaths: [resolve(__dirname, 'public/app.scss'), resolve(__dirname, 'public/app.css')].find(p => existsSync(p)),
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    init(server, options) {
      server.log(['status', 'info', 'ezmesure:plugin'], 'ezmesure Initializing...');
      api(server);
    },

  });
};
