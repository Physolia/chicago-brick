/* Copyright 2015 Google Inc. All Rights Reserved.

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

'use strict';

/**
 * Defines the wall layout: what modules to run, for how long, etc.
 */
class Layout {
  constructor(config) {
    // The list of module names to play.
    this.modules = config.modules;

    // How long to run the entire layout.
    this.duration = config.duration || config.moduleDuration;

    // How long to run individual modules, if there is more than one module.
    this.moduleDuration = config.moduleDuration || config.duration;

    // The max number of partitions into which to split the wall.
    this.maxPartitions = config.maxPartitions;
  }
}

module.exports = Layout;
