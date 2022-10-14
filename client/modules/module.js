/* Copyright 2019 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

import {Polygon} from '/lib/math/polygon2d.ts';
import * as moduleTicker from '/client/modules/module_ticker.js';
import * as network from '/client/network/network.js';
import * as peerNetwork from '/client/network/peer.js';
import {easyLog} from '/lib/log.js';
import {assert} from '/lib/assert.ts';
import asset from '/client/asset/asset.js';
import inject from '/lib/inject.ts';
import * as stateManager from '/client/state/state_manager.js';
import {TitleCard} from '/client/title_card.js';
import * as time from '/client/util/time.js';
import {delay} from '/lib/promise.ts';

function createNewContainer(name) {
  var newContainer = document.createElement('div');
  newContainer.className = 'container';
  newContainer.id = 't-' + time.now();
  newContainer.setAttribute('moduleName', name);
  return newContainer;
}

export const FadeTransition = {
  start(container) {
    if (container) {
      container.style.opacity = 0.001;
      document.querySelector('#containers').appendChild(container);
    }
  },
  async perform(oldModule, newModule, deadline) {
    if (newModule.name == '_empty') {
      // Fading out.. so fade *out* the *old* container.
      oldModule.container.style.transition =
          'opacity ' + time.until(deadline).toFixed(0) + 'ms';
      oldModule.container.style.opacity = 0.0;
    } else {
      newModule.container.style.transition =
          'opacity ' + time.until(deadline).toFixed(0) + 'ms';
      newModule.container.style.opacity = 1.0;
    }
    // TODO(applmak): Maybe wait until css says that the transition is done?
    await delay(time.until(deadline));
  }
}


export class ClientModule {
  constructor(name, path, config, titleCard, deadline, geo, transition) {
    // The module name.
    this.name = name;

    // The path to the main file of this module.
    this.path = path;

    // The module config.
    this.config = config;

    // The title card instance for this module.
    this.titleCard = titleCard;

    // Absolute time when this module is supposed to be visible. Module will
    // actually be faded in by deadline + 5000ms.
    this.deadline = deadline;

    // The wall geometry.
    this.geo = geo;

    // The transition to use to transition to this module.
    this.transition = transition;

    // The dom container for the module's content.
    this.container = null;

    // Module class instance.
    this.instance = null;

    // Network instance for this module.
    this.network = null;
  }

  // Deserializes from the json serialized form of ModuleDef in the server.
  static deserialize(bits) {
    if (bits.module.name == '_empty') {
      return ClientModule.newEmptyModule(bits.time);
    }
    return new ClientModule(
      bits.module.name,
      bits.module.path,
      bits.module.config,
      new TitleCard(bits.module.credit),
      bits.time,
      new Polygon(bits.geo),
      FadeTransition,
    );
  }

  static newEmptyModule(deadline = 0, transition = FadeTransition) {
    return new ClientModule(
      '_empty',
      '',
      {},
      new TitleCard({}),
      deadline,
      new Polygon([{x: 0, y:0}]),
      transition
    );
  }

  // Extracted out for testing purposes.
  static async loadPath(path) {
    return await import(path);
  }

  async instantiate() {
    this.container = createNewContainer(this.name);

    if (!this.path) {
      return;
    }

    const INSTANTIATION_ID =
      `${this.geo.extents.serialize()}-${this.deadline}`;
    this.network = network.forModule(INSTANTIATION_ID);
    let openNetwork = this.network.open();
    this.stateManager = stateManager.forModule(network, INSTANTIATION_ID);
    const fakeEnv = {
      asset,
      debug: easyLog('wall:module:' + this.name),
      game: undefined,
      network: openNetwork,
      titleCard: this.titleCard.getModuleAPI(),
      state: this.stateManager.open(),
      wallGeometry: this.geo,
      peerNetwork,
      assert,
    };
    try {
      const {load} = await ClientModule.loadPath(this.path);
      if (!load) {
        throw new Error(`${this.name} did not export a 'load' function!`);
      }
      const {client} = inject(load, fakeEnv);
      this.instance = new client(this.config);
    } catch (e) {
      // something went very wrong. Wind everything down.!
      this.network.close();
      this.network = null;
      throw e;
    }
  }

  // Returns true if module is still OK.
  async willBeShownSoon() {
    if (!this.path) {
      return;
    }
    // Prep the container for transition.
    // TODO(applmak): Move the transition smarts out of ClientModule.
    this.transition.start(this.container);
    try {
      await this.instance.willBeShownSoon(this.container, this.deadline);
    } catch(e) {
      this.dispose();
      throw e;
    }
  }

  // Returns true if module is still OK.
  beginTransitionIn(deadline) {
    if (!this.path) {
      return;
    }
    moduleTicker.add(this.name, this.instance);
    try {
      this.instance.beginFadeIn(deadline);
    } catch (e) {
      this.dispose();
      throw e;
    }
  }

  finishTransitionIn() {
    if (!this.path) {
      return;
    }
    this.titleCard.enter();
    this.instance.finishFadeIn();
  }

  beginTransitionOut(deadline) {
    if (!this.path) {
      return;
    }
    this.titleCard.exit();
    this.instance.beginFadeOut(deadline);
  }

  finishTransitionOut() {
    if (!this.path) {
      return;
    }
    this.instance.finishFadeOut();
  }

  async performTransition(otherModule, transitionFinishDeadline) {
    await this.transition.perform(otherModule, this, transitionFinishDeadline);
  }

  dispose() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    if (!this.path) {
      return;
    }
    this.titleCard.exit();  // Just in case.
    moduleTicker.remove(this.instance);

    if (this.network) {
      this.stateManager.close();
      this.stateManager = null;
      this.network.close();
      this.network = null;
    }
  }
}
