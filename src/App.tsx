import { useState } from "react"
import Pathfinding from "./components/Pathfinding/Pathfinding"
import { IoHelpCircle, IoLogoGithub, IoLogoReact } from "react-icons/io5"

function App () {
    const [showHelp, setShowHelp] = useState<boolean>(false)

    function handleHelpClicked () {
        setShowHelp(!showHelp)
    }

    return <div className="font-arial">
        <div className="flex h-20 bg-slate-100 text-slate-800 items-center p-6 text-2xl shadow-sm z-20">
            <div className="w-full font-bold flex items-center gap-1">
                <IoLogoReact className="animate-slow-spin text-blue-500" />
                Pathfinding
            </div>
            <div className="flex items-center justify-end w-full">
                <IoHelpCircle className="hover:animate-shake cursor-pointer" size="3rem" onClick={handleHelpClicked} />
                <div
                    className = {`absolute top-24 w-1/3 z-10 bg-slate-100 border-slate-300 border-2 rounded-3xl text-base text-slate-700 p-6
                        ${showHelp ? 'visible' : 'hidden'}
                    `}
                >
                    <div className="text-lg font-bold">Controls</div>
                    <hr />
                    <br />
                    <div className="flex gap-1">
                        <img src="mouseLeft.svg" width="32px" height="32px" />
                        <div>
                            Use the <strong>left mouse button</strong> to
                            <ul className="list-disc list-inside">
                                <li>Place walls</li>
                                <li>Destroy walls</li>
                                <li>Move agents</li>
                                <li>Move agents' targets</li>
                            </ul>
                        </div>
                    </div>
                    <br />
                    <hr />
                    <br />
                    <div className="flex gap-1">
                        <img src="mouseRight.svg" width="32px" height="32px" />
                        <div>
                            Use the <strong>right mouse button</strong> to
                            <ul className="list-disc list-inside">
                                <li>Place agents</li>
                                <li>Delete agents</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <a target="_blank" href="https://www.github.com/kvbc/react-pathfinding">
                    <IoLogoGithub className="cursor-pointer hover:animate-shake" size="2.5rem" />
                </a>
            </div>
        </div>
        <Pathfinding height={10} />
    </div>
}

export default App