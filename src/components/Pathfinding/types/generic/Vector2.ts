export class TReadonlyVector2 {
    protected _x: number
    protected _y: number

    constructor (x: number, y: number) {
        this._x = x
        this._y = y
    }

    clone (): TVector2 {
        return new TVector2(
            this._x,
            this._y
        )
    }

    getX (): number {
        return this._x
    }

    getY (): number {
        return this._y
    }

    equals (other: TReadonlyVector2) {
        return (this._x === other.getX()) && (this._y === other.getY())
    }
}

export class TVector2 extends TReadonlyVector2 {
    setX (x: number): void {
        this._x = x
    }

    setY (y: number): void {
        this._y = y
    }
}