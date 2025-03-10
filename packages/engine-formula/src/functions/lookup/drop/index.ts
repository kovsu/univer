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

import { ErrorType } from '../../../basics/error-type';
import { expandArrayValueObject } from '../../../engine/utils/array-object';
import { ErrorValueObject } from '../../../engine/value-object/base-value-object';
import { NumberValueObject } from '../../../engine/value-object/primitive-object';
import { BaseFunction } from '../../base-function';
import type { ArrayValueObject } from '../../../engine/value-object/array-value-object';
import type { BaseValueObject } from '../../../engine/value-object/base-value-object';

export class Drop extends BaseFunction {
    override minParams = 2;

    override maxParams = 3;

    override calculate(array: BaseValueObject, rows: BaseValueObject, columns?: BaseValueObject): BaseValueObject {
        const _columns = columns ?? NumberValueObject.create(0);

        const arrayRowCount = array.isArray() ? (array as ArrayValueObject).getRowCount() : 1;
        const arrayColumnCount = array.isArray() ? (array as ArrayValueObject).getColumnCount() : 1;

        const maxRowLength = Math.max(
            rows.isArray() ? (rows as ArrayValueObject).getRowCount() : 1,
            _columns.isArray() ? (_columns as ArrayValueObject).getRowCount() : 1
        );

        const maxColumnLength = Math.max(
            rows.isArray() ? (rows as ArrayValueObject).getColumnCount() : 1,
            _columns.isArray() ? (_columns as ArrayValueObject).getColumnCount() : 1
        );

        const rowsArray = expandArrayValueObject(maxRowLength, maxColumnLength, rows, ErrorValueObject.create(ErrorType.NA));
        const columnsArray = expandArrayValueObject(maxRowLength, maxColumnLength, _columns, ErrorValueObject.create(ErrorType.NA));

        if (maxRowLength > 1 || maxColumnLength > 1) {
            return rowsArray.mapValue((rowsObject, rowIndex, columnIndex) => {
                const columnsObject = columnsArray.get(rowIndex, columnIndex) as BaseValueObject;

                if (array.isError()) {
                    return array;
                }

                if (array.isNull()) {
                    return ErrorValueObject.create(ErrorType.VALUE);
                }

                const { isError, errorObject } = this._checkRowsColumns(rowsObject, columnsObject, arrayRowCount, arrayColumnCount);

                if (isError) {
                    return errorObject as ErrorValueObject;
                }

                if (array.isArray()) {
                    return ErrorValueObject.create(ErrorType.VALUE);
                }

                return array;
            });
        }

        if (array.isError()) {
            return array;
        }

        if (array.isNull()) {
            return ErrorValueObject.create(ErrorType.VALUE);
        }

        const rowsObject = rows.isArray() ? (rows as ArrayValueObject).get(0, 0) as BaseValueObject : rows;
        const columnsObject = _columns.isArray() ? (_columns as ArrayValueObject).get(0, 0) as BaseValueObject : _columns;

        const { isError, errorObject, rowsValue, columnsValue } = this._checkRowsColumns(rowsObject, columnsObject, arrayRowCount, arrayColumnCount);

        if (isError) {
            return errorObject as ErrorValueObject;
        }

        return this._getResultArray(array, rowsValue as number, columnsValue as number, arrayRowCount, arrayColumnCount);
    }

    private _checkRowsColumns(rowsObject: BaseValueObject, columnsObject: BaseValueObject, arrayRowCount: number, arrayColumnCount: number) {
        if (rowsObject.isError()) {
            return {
                isError: true,
                errorObject: rowsObject as ErrorValueObject,
            };
        }

        if (columnsObject.isError()) {
            return {
                isError: true,
                errorObject: columnsObject as ErrorValueObject,
            };
        }

        const rowsValue = Math.trunc(+rowsObject.getValue());
        const columnsValue = Math.trunc(+columnsObject.getValue());

        if (Number.isNaN(rowsValue) || Number.isNaN(columnsValue)) {
            return {
                isError: true,
                errorObject: ErrorValueObject.create(ErrorType.VALUE),
            };
        }

        if (Math.abs(rowsValue) >= arrayRowCount || Math.abs(columnsValue) >= arrayColumnCount) {
            return {
                isError: true,
                errorObject: ErrorValueObject.create(ErrorType.CALC),
            };
        }

        return {
            isError: false,
            rowsValue,
            columnsValue,
        };
    }

    private _getResultArray(array: BaseValueObject, rows: number, columns: number, arrayRowCount: number, arrayColumnCount: number): BaseValueObject {
        const rowParam = rows >= 0 ? [rows, arrayRowCount] : [0, arrayRowCount + rows];
        const columnParam = columns >= 0 ? [columns, arrayColumnCount] : [0, arrayColumnCount + columns];

        let resultArray: ArrayValueObject;

        if ((rows === 0 && columns === 0)) {
            resultArray = array as ArrayValueObject;
        } else if (rows === 0) {
            resultArray = (array as ArrayValueObject).slice(undefined, columnParam) as ArrayValueObject;
        } else if (columns === 0) {
            resultArray = (array as ArrayValueObject).slice(rowParam, undefined) as ArrayValueObject;
        } else {
            resultArray = (array as ArrayValueObject).slice(rowParam, columnParam) as ArrayValueObject;
        }

        resultArray = resultArray.map((valueObject) => valueObject.isNull() ? NumberValueObject.create(0) : valueObject) as ArrayValueObject;

        if (arrayRowCount - rows === 1 && arrayColumnCount - columns === 1) {
            return resultArray.get(0, 0) as BaseValueObject;
        }

        return resultArray;
    };
}
