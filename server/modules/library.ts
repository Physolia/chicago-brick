/** A class that holds onto all the known module definitions. */

import { easyLog } from "../../lib/log.ts";
import { ModuleDef } from "./module_def.ts";

const log = easyLog("wall:library");

export interface CreditAuthorTitleJson {
  title: string;
  author?: string;
}

export interface CreditImageJson {
  image: string;
}

export type CreditJson = CreditAuthorTitleJson | CreditImageJson;

export interface BrickJson {
  name: string;
  extends?: string;
  client_path: string;
  server_path?: string;
  credit: CreditJson;
  config?: Record<string, unknown>;
  testonly: boolean;
}

export interface ModuleConfig extends BrickJson {
  root: string;
}

class ModuleLibrary extends Map<string, ModuleDef> {
  /**
   * Turns module configs into module defs. Returns a map of name => def.
   */
  loadAllModules(configs: ModuleConfig[]) {
    for (const config of configs.filter((c) => !c.extends)) {
      // This is a "base" module. Make a moduleDef.
      this.set(
        config.name,
        new ModuleDef(
          config.name,
          config.root,
          {
            server: config.server_path ?? "",
            client: config.client_path ?? "",
          },
          "",
          config.config ?? {},
          config.credit || {},
          !!config.testonly,
        ),
      );
    }

    for (const config of configs.filter((c) => c.extends)) {
      // This is an extension module, so we need to combine some things to make a module def.
      const base = this.get(config.extends!);
      if (!base) {
        log.error(
          `Module ${config.name} attempted to extend module ${config.extends}, which cannot be found.`,
        );
        continue;
      }
      this.set(
        config.name,
        new ModuleDef(
          config.name,
          base.root,
          {
            server: base.serverPath,
            client: base.clientPath,
          },
          base.name,
          { ...base.config, ...config.config ?? [] },
          config.credit || {},
          !!config.testonly,
        ),
      );
    }
  }
}

export const library = new ModuleLibrary();
