import { useEffect, useMemo, useRef, useState } from "react";
import * as PIXI from "pixi.js";

const BattleGoose = () => {
    const [players, setPlayers] = useState<any>({});
    const [projectiles, setProjectiles] = useState<any[]>([]);

    const playersRef = useRef<any>({});
    const projectilesRef = useRef<any[]>([]);

    const resourcesRef = useRef<Record<string, any>>({});

    // Synchronise useRef and useState
    useEffect(() => {
        playersRef.current = players;
    }, [players]);

    useEffect(() => {
        projectilesRef.current = projectiles;
    }, [projectiles]);

    const pixapp = useMemo(() => {
        let app = new PIXI.Application({ width: 840, height: 560 });

        return app;
    }, []);

    const AddSprite = (players: any[]) => {
        const tmp: any[] = [...players];

        const playerObject: any = {};

        if (!Object.keys(resourcesRef.current).length) return;

        for (const p of tmp) {
            playerObject[p.uid] = {
                sprite: PIXI.Sprite.from(resourcesRef.current.logo.texture),
                position: p.position,
                uid: p.uid,
            };
            pixapp.stage.addChild(playerObject[p.uid].sprite);
            //     if (!tmp[i].sprite) {
            //         tmp[i].sprite = PIXI.Sprite.from(resourcesRef.current.logo.texture);
            //         pixapp.stage.addChild(tmp[i].sprite);
            //         console.log("sprite added");
            //     }
        }
        setPlayers(playerObject);
    };

    const handleKeyboardEvent = (event: KeyboardEvent) => {
        const key = event.key;

        if (key === "w") socket?.send(JSON.stringify({ event: "FORCE", position: [0, -1.0, 0] }));
        if (key === "s") socket?.send(JSON.stringify({ event: "FORCE", position: [0, 1.0, 0] }));
        if (key === "a") socket?.send(JSON.stringify({ event: "FORCE", position: [-1, 0, 0] }));
        if (key === "d") socket?.send(JSON.stringify({ event: "FORCE", position: [1, 0, 0] }));

        if (key === " ") socket?.send(JSON.stringify({ event: "FIRE" }));
    };

    const socket = useMemo(() => {
        const sck = new WebSocket("ws://127.0.0.1:5556");

        if (sck == null) {
            return null;
        }

        document.addEventListener("keydown", handleKeyboardEvent);

        setTimeout(() => {
            document.getElementById("pixi-container")?.appendChild(pixapp.view);
            const loader = PIXI.Loader.shared;

            loader.add("logo", "logo192.png");

            loader.load((loader, resources) => {
                resourcesRef.current = resources;

                // setTimeout(() => {
                //     socket?.send(JSON.stringify({ event: "INIT" }));
                // }, 200);
                let elapsed = 0.0;
                pixapp.ticker.add((delta: number) => {
                    elapsed += delta;

                    for (const uid in playersRef.current) {
                        if (playersRef.current[uid].sprite) {
                            playersRef.current[uid].sprite.position.x = playersRef.current[uid].position[0];
                            playersRef.current[uid].sprite.position.y = playersRef.current[uid].position[1];
                        } else {
                            console.log("Adding new sprite");
                            const sprite = new PIXI.Sprite(resourcesRef.current.logo.texture);

                            playersRef.current[uid].sprite = sprite;
                            pixapp.stage.addChild(sprite);
                        }
                    }

                    for (const uid in projectilesRef.current) {
                        const projectile = projectilesRef.current[uid];

                        if (projectile.sprite) {
                            projectile.sprite.position.x = projectile.position[0];
                            projectile.sprite.position.y = projectile.position[1];
                        } else {
                            const sprite = new PIXI.Sprite(resourcesRef.current.logo.texture);
                            projectile.sprite = sprite;
                            projectile.sprite.position.x = projectile.position[0];
                            projectile.sprite.position.y = projectile.position[1];
                            pixapp.stage.addChild(sprite);
                        }
                    }

                    // console.log(pixapp.stage.children);
                });
            });
        }, 150);

        sck.onmessage = (event: MessageEvent<any>) => {
            const data = JSON.parse(event.data);

            // console.log(data);

            // console.clear();
            // console.log(data.event);

            if (data.event === "SINGLE_PROJECTILE_UPDATE") {
                const tmp = projectilesRef.current;

                if (!tmp[data.data.uuid]) {
                    console.log("Creating projectile", data.data.uuid);

                    tmp[data.data.uuid] = {
                        sprite: null, //PIXI.Sprite.from(resourcesRef.current.logo.texture),
                        position: data.data.position,
                        uid: data.data.uid,
                    };
                } else {
                    tmp[data.data.uuid].position[0] = data.data.position[0];
                    tmp[data.data.uuid].position[1] = data.data.position[1];
                }

                setProjectiles(tmp);
            }
            if (data.event === "PROJECTILE_DELETE") {
                const tmp = projectilesRef.current;

                if (!tmp[data.uuid]) {
                    return;
                }
                const projectile = tmp[data.uuid];

                pixapp.stage.removeChild(projectile.sprite);
                projectile.sprite = null;

                delete tmp[data.uuid];

                setProjectiles(tmp);
            }

            switch (data.event) {
                case "SINGLE_PLAYER_UPDATE":
                    const tmp = playersRef.current;

                    if (!tmp[data.data.uuid]) {
                        console.log("Creating player", data.data.uuid);

                        tmp[data.data.uuid] = {
                            sprite: null, //PIXI.Sprite.from(resourcesRef.current.logo.texture),
                            position: data.data.position,
                            uid: data.data.uid,
                        };
                    } else {
                        tmp[data.data.uuid].position[0] = data.data.position[0];
                        tmp[data.data.uuid].position[1] = data.data.position[1];
                    }

                    setPlayers(tmp);
                    break;
                // case "PLAYERS":
                //     // setPlayers(data.players);

                //     console.log(data.players);
                //     AddSprite(
                //         data.players.map((player: any) => ({
                //             uid: player.uid,
                //             position: player.position,
                //             sprite: null,
                //         }))
                //     );
                //     // setPlayers(
                //     //     data.players.map((player: any) => ({
                //     //         uid: player.uid,
                //     //         position: player.position,
                //     //         sprite: null,
                //     //     }))
                //     // );
                //     break;
            }
        };

        return sck;
    }, []);

    return <div id="pixi-container"></div>;
};

export default BattleGoose;
