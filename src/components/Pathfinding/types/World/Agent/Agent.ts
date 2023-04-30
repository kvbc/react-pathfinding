import { TReadonlyVector2 } from "../../generic/Vector2"

export type TTarget = TReadonlyVector2 | TReadonlyAgent

export class TReadonlyAgent {
    protected _position: TReadonlyVector2
    protected _lastPosition: TReadonlyVector2 | null
    protected _target: TTarget

    constructor (
        position: TReadonlyVector2,
        target: TTarget,
    ) {
        this._lastPosition = null
        this._position = position.clone()
        this._target = target
    }

    //
    //
    //

    getLastPosition (): TReadonlyVector2 | null {
        return this._lastPosition
    }

    getPosition (): TReadonlyVector2 {
        return this._position
    }

    getTarget (): TTarget {
        return this._target
    }

    getTargetPosition (): TReadonlyVector2 {
        if (this._target instanceof TReadonlyAgent)
            return this._target.getPosition()
        return this._target
    }
}

export class TAgent extends TReadonlyAgent {
    setTarget (target: TTarget): void {
        this._target = target
    }

    _setPosition (position: TReadonlyVector2): void {
        this._lastPosition = this._position.clone()
        this._position = position.clone()
    }
}