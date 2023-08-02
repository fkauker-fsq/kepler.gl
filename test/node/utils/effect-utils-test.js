// Copyright (c) 2023 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import {LightingEffect, PostProcessEffect} from '@deck.gl/core';
import test from 'tape';

import {computeDeckEffects} from '@kepler.gl/utils';
import {VisStateActions} from '@kepler.gl/actions';
import {visStateReducer} from '@kepler.gl/reducers';
import {createEffect} from '@kepler.gl/effects';
import {
  POSTPROCESSING_EFFECTS,
  LIGHT_AND_SHADOW_EFFECT,
  DEFAULT_POST_PROCESSING_EFFECT_TYPE
} from '@kepler.gl/constants';

import {InitialState} from 'test/helpers/mock-state';

test('effectUtils -> computeDeckEffects', t => {
  const initialState = InitialState.visState;
  let nextState = visStateReducer(
    initialState,
    VisStateActions.addEffect({id: 'e_1', type: 'sepia', isEnabled: false})
  );
  nextState = visStateReducer(initialState, VisStateActions.addEffect({id: 'e_1', type: 'ink'}));
  nextState = visStateReducer(
    nextState,
    VisStateActions.addEffect({
      id: 'e_shadow',
      type: 'lightAndShadow',
      parameters: {timestamp: 1689383452635}
    })
  );

  let deckEffects = computeDeckEffects({
    visState: nextState,
    mapState: {latitude: 51.033105, longitude: 0.348512}
  });

  t.equal(deckEffects.length, 2, "disabled deck effects aren't not generated");
  t.ok(deckEffects[0] instanceof LightingEffect, 'lighting effect should be generated');
  t.ok(deckEffects[1] instanceof PostProcessEffect, 'post-processing effect should be generated');

  // nighttime
  t.equal(deckEffects[0].outputUniformShadow, true, 'shadows should be applied uniformly');
  t.equal(deckEffects[0].directionalLights[0].intensity, 0, 'directional light should be disabled');

  // daytime
  nextState.effects[1].setProps({parameters: {timestamp: 1689415852635}});
  deckEffects = computeDeckEffects({
    visState: nextState,
    mapState: {latitude: 51.033105, longitude: 0.348512}
  });
  t.equal(deckEffects[0].shadowColor[3], 0.5, 'shadows should be enabled');
  t.equal(deckEffects[0].directionalLights[0].intensity, 1, 'directional light should be enabled');

  t.end();
});

test('effectUtils -> createEffect', t => {
  const defaultEffect = createEffect({});
  const postProcessingEffect = createEffect({
    type: POSTPROCESSING_EFFECTS.hueSaturation.type
  });
  const lightEffect = createEffect({type: LIGHT_AND_SHADOW_EFFECT.type});

  t.equal(
    defaultEffect.type,
    DEFAULT_POST_PROCESSING_EFFECT_TYPE,
    'should create default ink effect'
  );
  t.equal(
    postProcessingEffect.type,
    POSTPROCESSING_EFFECTS.hueSaturation.type,
    'should create hueSaturation effect'
  );
  t.equal(lightEffect.type, LIGHT_AND_SHADOW_EFFECT.type, 'should create Light&Shadow effect');

  t.end();
});
