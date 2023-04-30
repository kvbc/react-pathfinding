import assert from "../../../../../common/assert";
import * as Event from "../../generic/Event";
import * as Field from "../../generic/Field/index";
import { TReadonlyVector2 } from "../../generic/Vector2";
import * as World from "../index"
import { Pathfinding } from "../index";

export enum ECellState {
    UNKNOWN,
    OPEN,
    CLOSED,
    BEST
}

/*
 *
 * Cell
 * 
 */

export class TReadonlyCell extends Pathfinding.TCell {
    protected _distanceTraveled: number = 0 // g
    protected _estimatedFullTravelDistance: number = 0 // f TODO: rename this...
    protected _parent: TCell | null = null
    protected _state: ECellState = ECellState.UNKNOWN

    getDistanceTraveled (): number {
        return this._distanceTraveled
    }

    getEstimatedFullTravelDistance (): number {
        return this._estimatedFullTravelDistance
    }

    getParent (): TCell | null {
        return this._parent
    }

    getState (): ECellState {
        return this._state
    }
}

export class TCell extends TReadonlyCell {
    setDistanceTraveled (distanceTraveled: number): void {
        this._distanceTraveled = distanceTraveled
    }

    setEstimatedFullTravelDistance (estimatedFullTravelDistance: number): void {
        this._estimatedFullTravelDistance = estimatedFullTravelDistance
    }

    setParent (parent: TCell): void {
        this._parent = parent
    }

    setState (state: ECellState): void {
        this._state = state
    }
}

/*
 *
 *
 * 
 */

type TField = Pathfinding.TField<TCell>
type TReadonlyField = Pathfinding.TReadonlyField<TReadonlyCell>
export type TResult = Pathfinding.TResult<TReadonlyCell>
// export type TFunction = Pathfinding.TFunction<TReadonlyCell, TFunctionExtraParams>
// export type TFunctionExtraParams = [heuristic: EHeuristic]
export type TFunction = Pathfinding.TFunction<TReadonlyCell>

/*
 *
 *
 * 
 */

export const pathfind: TFunction = function (input: Pathfinding.TInput): TResult {
    function distance (a: TReadonlyVector2, b: TReadonlyVector2): number {
        switch (input.getBase().getHeuristic()) {
        case Pathfinding.EHeuristic.MANHATTAN:
            return Math.abs(a.getX() - b.getX()) + Math.abs(a.getY() - b.getY())
        case Pathfinding.EHeuristic.DIAGONAL:
            const dx = Math.abs(a.getX() - b.getX())
            const dy = Math.abs(a.getY() - b.getY())
            return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy)
        case Pathfinding.EHeuristic.EUCLIDEAN:
            return Math.sqrt(
                (a.getX() - b.getX())**2 +
                (a.getY() - b.getY())**2
            )
        }
    }

    /*
     *
     *
     * 
     */

    const pathfindingField: TField = new Field.TField<TCell>(
        input.getWalkableField().getWidth(),
        input.getWalkableField().getHeight(),
        () => new TCell()
    )
    const requestUpdateEvent = new Event.TDispatchableEvent<[]>()

    let promise = new Promise<Pathfinding.TReadonlyPath>(async resolve => {
        async function wait () {
            await input.getGlobal().getPausePromise()
            if (input.getBase().isUsingDelay())
                return new Promise(res => setTimeout(res, input.getGlobal().getStepDelay()))
            return Promise.resolve()    
        }
     
        async function setCellState (cell: TCell, state: ECellState) {
            cell.setState(state)
            if (input.getBase().isUsingDelay())
                requestUpdateEvent.dispatch()
            return wait()
        }
        
        /*
         *
         *
         * 
         */
       
        let openCells: Set<TCell> = new Set<TCell>()
        openCells.add(
            pathfindingField.getCellAt(input.getStartPosition())
        )
        let closedCells: Set<TCell> = new Set<TCell>()

        function setAllUsedCellsState (state: ECellState) {
            for (let set of [openCells, closedCells])
                for (let cell of set)
                    setCellState(cell, state)
        }

        /*
         *
         *
         * 
         */

        while (openCells.size !== 0) {
            let bestCell: TCell = openCells.values().next().value // first value of open set
            for (let cell of openCells)
                if (cell.getEstimatedFullTravelDistance() < bestCell.getEstimatedFullTravelDistance())
                    bestCell = cell

            await setCellState(bestCell, ECellState.BEST)

            if (bestCell.getPosition().equals(input.getTargetPosition())) {
                let path: Array<TCell> = []
                let cell: TCell | null = bestCell

                while (cell !== null) {
                    path.push(cell)
                    cell = cell.getParent()
                }
                
                setAllUsedCellsState(ECellState.UNKNOWN)

                for (let cell of path) {
                    await setCellState(cell, ECellState.BEST)
                }

                path.reverse()

                resolve(path.map(pathfindingCell => pathfindingCell.getPosition()))
                return
            }

            assert(openCells.delete(bestCell))
            
            for (let neighbourWorldCell of input.getWalkableField().getNeighbourCellsAt(bestCell.getPosition())) {
                if (!neighbourWorldCell.isWalkable())
                    continue
                // if (!neighbourWorldCell.getPosition().equals(input.getTargetPosition()))
                //     continue

                function getPathfindingCell (set: Set<TCell>): TCell | null {
                    for (let cell of set)
                        if (cell.getPosition().equals(neighbourWorldCell.getPosition()))
                            return cell
                    return null
                }

                if (getPathfindingCell(closedCells) !== null)
                    continue

                let distanceTraveled = bestCell.getDistanceTraveled() + distance(
                    bestCell.getPosition(),
                    neighbourWorldCell.getPosition()
                )
                let estimatedDistanceToTravel = distance(
                    neighbourWorldCell.getPosition(),
                    input.getTargetPosition()
                )
                let estimatedFullTravelDistance = distanceTraveled + estimatedDistanceToTravel

                let cell = getPathfindingCell(openCells)
                if (cell) {
                    if (cell.getEstimatedFullTravelDistance() < estimatedFullTravelDistance)
                        continue
                    assert(openCells.delete(cell))
                }
                
                let neighbourCell = pathfindingField.getCellAt(neighbourWorldCell.getPosition())
                neighbourCell.setEstimatedFullTravelDistance(estimatedFullTravelDistance)
                neighbourCell.setDistanceTraveled(distanceTraveled)
                neighbourCell.setParent(bestCell)
                openCells.add(neighbourCell)
                await setCellState(neighbourCell, ECellState.OPEN)
            }

            closedCells.add(bestCell)
            await setCellState(bestCell, ECellState.CLOSED)
        }

        setAllUsedCellsState(ECellState.UNKNOWN)
        resolve([])
    })

    return new Pathfinding.TResult<TReadonlyCell>(
        pathfindingField as TReadonlyField,
        promise,
        requestUpdateEvent,
        input.getTargetPosition()
    )
}