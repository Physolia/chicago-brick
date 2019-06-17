/* Copyright 2018 Google Inc. All Rights Reserved.

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

import * as info from '/client/util/info.js';
import * as monitor from '/client/monitoring/monitor.js';
import * as network from '/client/network/network.js';
import * as time from '/client/util/time.js';
import Debug from '/lib/lame_es6/debug.js';
import {ClientModulePlayer} from '/client/modules/client_module_player.js';
import {ClientModule} from '/client/modules/module.js';

Debug.enable('wall:*');

// Open our socket to the server.
network.openConnection(info.virtualRectNoBezel);

if (new URL(window.location.href).searchParams.get('monitor')) {
  monitor.enable();
}

// Ready to receive some code!
time.start();

const modulePlayer = new ClientModulePlayer;

// Server has asked us to load a new module.
network.on('loadModule',
    bits => modulePlayer.playModule(ClientModule.deserialize(bits)));
