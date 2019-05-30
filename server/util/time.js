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

const time = process.hrtime();

export function now() {
  var timeBits = process.hrtime(time);
  return timeBits[0] * 1000 + timeBits[1] / 1e6;
}

export function inFuture(msDuration) {
  return now() + msDuration;
}

export function until(msDeadline) {
  var d = msDeadline - now();
  return Math.max(0, d);
}
