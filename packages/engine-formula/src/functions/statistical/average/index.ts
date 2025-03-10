/**
 * Copyright 2023-present DreamNum Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { BaseValueObject } from '../../../engine/value-object/base-value-object';
import { NumberValueObject } from '../../../engine/value-object/primitive-object';
import { BaseFunction } from '../../base-function';

export class Average extends BaseFunction {
    override minParams = 1;

    override maxParams = 255;

    override calculate(...variants: BaseValueObject[]) {
        let accumulatorSum: BaseValueObject = NumberValueObject.create(0);
        let accumulatorCount: BaseValueObject = NumberValueObject.create(0);
        for (let i = 0; i < variants.length; i++) {
            let variant = variants[i];

            if (variant.isString() || variant.isBoolean()) {
                variant = variant.convertToNumberObjectValue();
            }

            if (variant.isError()) {
                return variant;
            }

            if (variant.isArray()) {
                accumulatorSum = accumulatorSum.plus(variant.sum());

                if (accumulatorSum.isError()) {
                    return accumulatorSum;
                }

                accumulatorCount = accumulatorCount.plus(variant.count());
            } else if (!variant.isNull()) {
                accumulatorSum = accumulatorSum.plus(variant);
                accumulatorCount = accumulatorCount.plus(NumberValueObject.create(1));
            }
        }

        return accumulatorSum.divided(accumulatorCount);
    }
}
