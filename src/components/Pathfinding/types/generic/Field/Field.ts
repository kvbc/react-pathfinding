import { TVector2, TReadonlyVector2 } from "../Vector2";
import assert from "../../../../../common/assert";

/*
 *
 * Cell
 * 
 */

export class TCell {
    private _position?: TVector2

    _setPosition (newPosition: TReadonlyVector2): void {
        assert((this._position === undefined) || this._position.equals(newPosition))
        this._position = newPosition.clone()
    }

    getPosition (): TReadonlyVector2 {
        assert(this._position !== undefined)
        return this._position
    }
}

/*
 *
 * Field
 * 
 */

export class TField<T extends TCell> {
    private _cells: Array<Array<T>>
    private _width: number
    private _height: number

    constructor (width: number, height: number, fillFunction: (pos: TVector2) => T) {
        assert(width > 0)
        assert(height > 0)

        this._width = width
        this._height = height

        this._cells = Array(height)
            .fill(null)
            .map((row, y) => 
                Array(width).fill(null).map((_, x) => {
                    let position = new TVector2(x, y)
                    let cell = fillFunction(position)
                    cell._setPosition(position)
                    return cell
                })
            )
    }

    getWidth (): number {
        return this._width
    }

    getHeight (): number {
        return this._height
    }

    resize (newWidth: number, newHeight: number, emptyFillFunction: () => T): void {
        this._cells = new TField<T>(newWidth, newHeight, (pos: TVector2): T => {
            if (this.hasCellAt(pos))
                return this.getCellAt(pos)
            return emptyFillFunction()
        })._cells
        this._width = newWidth
        this._height = newHeight
    }

    to2DArray (): ReadonlyArray<ReadonlyArray<T>> {
        return this._cells
    }

    hasCell (cell: T): boolean {
        for (let row of this._cells)
            if (row.includes(cell))
                return true
        return false
    }

    hasCellAt (position: TReadonlyVector2): boolean {
        return (
            (position.getY() in this._cells) &&
            (position.getX() in this._cells[position.getY()])
        )
    }

    getCellAt (position: TReadonlyVector2): T {
        assert(this.hasCellAt(position))
        return this._cells[position.getY()][position.getX()]
    }

    getNeighbourCellsAt (position: TReadonlyVector2): ReadonlyArray<T> {
        assert(this.hasCellAt(position))
        let neighbourCells: Array<T> = []

        for (let ix = -1; ix <= 1; ix++)
        for (let iy = -1; iy <= 1; iy++) {
            if (ix === 0)
            if (iy === 0)
                continue
            
            let neighbourPosition = new TVector2(
                position.getX() + ix,
                position.getY() + iy
            )

            if (this.hasCellAt(neighbourPosition))
                neighbourCells.push(this.getCellAt(neighbourPosition))
        }

        return neighbourCells
    }

    forEachCell (doFunc: (cell: T) => void): void {
        this._cells.forEach(row => 
            row.forEach(cell => 
                doFunc(cell)
            )    
        )
    }
}