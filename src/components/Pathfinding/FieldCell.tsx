import assert from "../../common/assert"
import * as World from "./types/World/index"
import { HiArrowPath } from "react-icons/hi2"
import { AiOutlineCheck } from "react-icons/ai"

type TMouseEvent = (event: React.MouseEvent, cell: World.TReadonlyCell) => void

interface IProps {
    cell: World.TReadonlyCell
    agent: World.Agent.TReadonlyAgent | null
    agentID: number | null
    agentRecord: null | World.TReadonlyAgentRecord
    pathfindingCell: World.Pathfinding.TReadonlyCell | null
    isSelected: boolean

    id: string

    onMouseEnter: TMouseEvent
    onMouseDown: TMouseEvent
    onContextMenu: TMouseEvent
}

function FieldCell ({ cell, id, agent, agentID, agentRecord, pathfindingCell, isSelected, onMouseEnter, onMouseDown, onContextMenu }: IProps) {
    let backStyles = "bg-slate-200"
    if (cell.isWall())
        backStyles = "bg-slate-800"
    else if (pathfindingCell !== null) {
        if (pathfindingCell instanceof World.Pathfinding.AStar.TCell) {
            switch (pathfindingCell.getState()) {
                case World.Pathfinding.AStar.ECellState.OPEN:
                    backStyles = "bg-green-200"
                    break
                case World.Pathfinding.AStar.ECellState.CLOSED:
                    backStyles = "bg-red-200"
                    break
                case World.Pathfinding.AStar.ECellState.BEST:
                    backStyles = "bg-yellow-200"
                    break
            }
        }
    }

    const bothStyles = "rounded-full w-12 h-12 cursor-pointer flex justify-center items-center"
    const borderStyles = "border-4 border-blue-300"
    let agentStyles = ""

    if (agent !== null) {
        let lastPosition = agent.getLastPosition()
        
        if (lastPosition !== null) {
            let currentPosition = agent.getPosition()

            let dx = currentPosition.getX() - lastPosition.getX()
            let dy = currentPosition.getY() - lastPosition.getY()

            const fromLeft  = (dx > 0)
            const fromRight = (dx < 0)
            const fromXMid  = !fromLeft && !fromRight
            const fromUp    = (dy > 0)
            const fromDown  = (dy < 0)
            const fromYMid  = !fromUp && !fromDown

            if (fromUp   && fromLeft)  agentStyles = "animate-move-from-nw"
            if (fromUp   && fromXMid)  agentStyles = "animate-move-from-n"
            if (fromUp   && fromRight) agentStyles = "animate-move-from-ne"
            if (fromYMid && fromLeft)  agentStyles = "animate-move-from-w"
            if (fromYMid && fromRight) agentStyles = "animate-move-from-e"
            if (fromDown && fromLeft)  agentStyles = "animate-move-from-sw"
            if (fromDown && fromXMid)  agentStyles = "animate-move-from-s"
            if (fromDown && fromRight) agentStyles = "animate-move-from-se"
        }
    }

    let isAgentTargetReached = false
    let isAgentPathfinding = false
    let isAgentWaiting = false
    if (agent !== null) {
        isAgentTargetReached = (agent.getPosition().equals(agent.getTargetPosition()))
        if (!isAgentTargetReached) {
            isAgentWaiting     = (agentRecord?.getStatus() === World.EAgentStatus.WAITING)
            isAgentPathfinding = (agentRecord?.getStatus() === World.EAgentStatus.PATHFINDING)
        }
    }
    const showAgentStatus = isAgentTargetReached || isAgentPathfinding || isAgentWaiting

    return <div
        onMouseEnter = {e => onMouseEnter(e, cell)}
        onMouseDown = {e => onMouseDown(e, cell)}
        onContextMenu = {e => onContextMenu(e, cell)}
        id = {id}
    >
        <div className={`
            ${bothStyles}
            ${backStyles}
            ${isSelected ? borderStyles : ''}
            relative transition-bg-color duration-150
        `} >
            {(agent !== null) &&
                <div className={`
                    ${bothStyles}
                    ${agentStyles}
                    absolute z-20
                `} >
                    <div className={`
                        ${bothStyles}
                        ${isSelected ? borderStyles : ''}
                        ${(agent.getLastPosition() === null) ? 'animate-shake' : ''}
                        bg-blue-200 z-20
                    `} >
                        {agentID}
                    </div>
                    <div className={`
                        ${showAgentStatus ? 'animate-fly-in' : 'animate-fly-out'}
                        absolute z-10 left-3/4 bottom-3/4 w-7 h-7 flex justify-center items-center
                    `}>
                        {isAgentWaiting &&
                            <div className="flex gap-1">
                                <div className={`animate-bounce-1 bg-slate-800 w-1 h-1 rounded-full`} />
                                <div className={`animate-bounce-2 bg-slate-800 w-1 h-1 rounded-full`} />
                                <div className={`animate-bounce-3 bg-slate-800 w-1 h-1 rounded-full`} />
                            </div>
                        }
                        {isAgentPathfinding &&
                            <>
                                <HiArrowPath className="absolute animate-spin" strokeWidth="10rem" color="white" />
                                <HiArrowPath className="absolute animate-spin" />
                            </>
                        }
                        {isAgentTargetReached && 
                            <>
                                <AiOutlineCheck className="absolute animate-shake" strokeWidth="30rem" color="white" />
                                <AiOutlineCheck className="absolute animate-shake" strokeWidth="1rem" />
                            </>
                        }
                    </div>
                </div>
            }   
        </div>
    </div>
}

export default FieldCell