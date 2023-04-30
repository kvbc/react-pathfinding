import { TListenableEvent } from "../../generic/Event"
import * as Field from "../../generic/Field/Field"
import { TReadonlyVector2 } from "../../generic/Vector2"
import * as World from "../index"
import * as Event from "../../generic/Event/index"

export type TPath = Array<TReadonlyVector2>
export type TReadonlyPath = ReadonlyArray<TReadonlyVector2>

export class TCell extends Field.TCell {}
export class TReadonlyCell extends TCell {}
export type TField<T extends TCell> = Field.TField<T>
export type TReadonlyField<T extends TReadonlyCell> = Field.TField<T>

export type TAnyResult = World.Pathfinding.AStar.TResult

/*
export type TFunction<
    T extends TReadonlyCell,
    TExtraParams extends Array<any>
> = (input: TInput, ...extraArgs: TExtraParams) => TResult<T>
*/
export type TFunction<
    T extends TReadonlyCell
> = (input: TInput) => TResult<T>

export enum EHeuristic {
    MANHATTAN, // 4-directional
    DIAGONAL, // 8-directional
    EUCLIDEAN // "all" directions
}

export enum EAlgorithm {
    ASTAR
}

export const pathfind = (input: TInput): TAnyResult => {
    switch (input.getBase().getAlgorithm()) {
    case EAlgorithm.ASTAR:
        return World.Pathfinding.AStar.pathfind(input)
    }
}

/*
 *
 * Result
 * 
 */

export class TResult<T extends TReadonlyCell> {
    private _field: TReadonlyField<T>
    private _targetPosition: TReadonlyVector2
    private _pathPromise: Promise<TReadonlyPath>
    private _path: TReadonlyPath | null
    private _requestUpdateEvent: TListenableEvent<[]>

    private _pathResolvedEvent = new Event.TDispatchableEvent<[]>()

    constructor (
        field: TReadonlyField<T>,
        pathPromise: Promise<TReadonlyPath>,
        requestUpdateEvent: TListenableEvent<[]>,
        targetPosition: TReadonlyVector2
    ) {
        this._field = field
        this._pathPromise = pathPromise
        this._requestUpdateEvent = requestUpdateEvent
        this._path = null
        this._targetPosition = targetPosition

        pathPromise.then(path => {
            this._path = path
            this._pathResolvedEvent.dispatch()
        })
    }

    getField              (): TReadonlyField<T>      { return this._field }
    getPathPromise        (): Promise<TReadonlyPath> { return this._pathPromise }
    getPath               (): TReadonlyPath | null   { return this._path }
    getRequestUpdateEvent (): TListenableEvent<[]>   { return this._requestUpdateEvent }
    getPathResolvedEvent  (): TListenableEvent<[]>   { return this._pathResolvedEvent }
    getTargetPosition     (): TReadonlyVector2       { return this._targetPosition }
}

/*
 *
 * Input
 * 
 */

export class TReadonlyInputCell extends Field.TCell {
    protected _isWalkable: boolean

    constructor (isWalkable: boolean) {
        super()
        this._isWalkable = isWalkable
    }

    isWalkable (): boolean {
        return this._isWalkable
    }
}

export class TInputCell extends TReadonlyInputCell {
    setIsWalkable (isWalkable: boolean): void {
        this._isWalkable = isWalkable
    }
}

export class TReadonlyInputField extends Field.TField<TReadonlyInputCell> {}
export class TInputField extends Field.TField<TInputCell> {}

export class TReadonlyInputBase {
    protected _isUsingDelay: boolean
    protected _heuristic: EHeuristic
    protected _algorithm: EAlgorithm

    constructor (
        isUsingDelay: boolean,
        heuristic: EHeuristic,
        algorithm: EAlgorithm
    ) {
        this._isUsingDelay = isUsingDelay
        this._heuristic = heuristic
        this._algorithm = algorithm
    }

    isUsingDelay (): boolean    { return this._isUsingDelay }
    getHeuristic (): EHeuristic { return this._heuristic }
    getAlgorithm (): EAlgorithm { return this._algorithm }
}

export class TInputBase extends TReadonlyInputBase {
    setIsUsingDelay (isUsingDelay: boolean): void {
        this._isUsingDelay = isUsingDelay
    }

    setHeuristic (heuristic: EHeuristic): void {
        this._heuristic = heuristic
    }

    setAlgorithm (algorithm: EAlgorithm): void {
        this._algorithm = algorithm
    }
}

export class TInput {
    private _walkableField: TReadonlyInputField
    private _startPosition: TReadonlyVector2
    private _targetPosition: TReadonlyVector2
    private _global: TReadonlyGlobalInput
    private _base: TReadonlyInputBase

    constructor (
        walkableField: TReadonlyInputField,
        startPosition: TReadonlyVector2,
        targetPosition: TReadonlyVector2,
        base: TReadonlyInputBase,
        global: TReadonlyGlobalInput
    ) {
        this._walkableField = walkableField
        this._startPosition = startPosition
        this._targetPosition = targetPosition
        this._global = global
        this._base = base
    }

    getWalkableField     (): TReadonlyInputField  { return this._walkableField }
    getStartPosition     (): TReadonlyVector2     { return this._startPosition }
    getTargetPosition    (): TReadonlyVector2     { return this._targetPosition }
    getGlobal            (): TReadonlyGlobalInput { return this._global }
    getBase              (): TReadonlyInputBase   { return this._base }
}

export class TReadonlyGlobalInput {
    protected _pausePromise: Promise<void>
    protected _stepDelay: number // in ms

    constructor (
        pausePromise: Promise<void>,
        stepDelay: number
    ) {
        this._pausePromise = pausePromise
        this._stepDelay = stepDelay
    }

    getPausePromise (): Promise<void> { return this._pausePromise }
    getStepDelay    (): number        { return this._stepDelay }
}

export class TGlobalInput extends TReadonlyGlobalInput {
    setPausePromise (pausePromise: Promise<void>): void {
        this._pausePromise = pausePromise
    }

    setStepDelay (stepDelay: number): void {
        this._stepDelay = stepDelay
    }
}