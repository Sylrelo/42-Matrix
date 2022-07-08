import { useEffect, useMemo, useRef, useState } from "react";
import * as PIXI from "pixi.js";

const BattleGoose = () => {
    const [players, setPlayers] = useState<any>({});
    const [projectiles, setProjectiles] = useState<any[]>([]);

    const playersRef = useRef<any>({});
    const projectilesRef = useRef<any[]>([]);
    const selfRef = useRef<string>("");

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

    const keyboardRef = useRef([0, 0, 0, 0]);

    const handleKeyboardEvent = () => {
        let move = [0, 0, 0];

        if (keyboardRef.current[0]) move = [0, -2.0, 0];
        if (keyboardRef.current[1]) move = [0, 2.0, 0];
        if (keyboardRef.current[2]) move = [-2, 0, 0];
        if (keyboardRef.current[3]) move = [2, 0, 0];

        // const player = playersRef.current[selfRef.current];

        // if (player) {
        //     const rot = player.sprite?.rotation;

        //     if (rot) {
        //         const nx = move[0] * Math.cos(rot) + move[1] * Math.sin(rot);
        //         const ny = move[1] * Math.sin(rot) - move[0] * Math.cos(rot);

        //         move[0] = nx;
        //         move[1] = ny;

        //         console.log(move);
        //     }
        // }
        if (move[0] || move[1]) {
            socket?.send(JSON.stringify({ event: "FORCE", position: move }));
        }

        // if (key === " ") socket?.send(JSON.stringify({ event: "FIRE" }));
    };

    const socket = useMemo(() => {
        const sck = new WebSocket("ws://127.0.0.1:5556");

        if (sck == null) {
            return null;
        }
        document.addEventListener("keydown", (event) => {
            const { key } = event;
            if (key === "w") keyboardRef.current[0] = 1;
            if (key === "s") keyboardRef.current[1] = 1;
            if (key === "a") keyboardRef.current[2] = 1;
            if (key === "d") keyboardRef.current[3] = 1;
            if (key === " ") socket?.send(JSON.stringify({ event: "FIRE" }));
        });
        document.addEventListener("keyup", (event) => {
            const { key } = event;
            if (key === "w") keyboardRef.current[0] = 0;
            if (key === "s") keyboardRef.current[1] = 0;
            if (key === "a") keyboardRef.current[2] = 0;
            if (key === "d") keyboardRef.current[3] = 0;
        });

        // document.addEventListener("keydown", handleKeyboardEvent);

        setTimeout(() => {
            document.getElementById("pixi-container")?.appendChild(pixapp.view);
            const loader = PIXI.Loader.shared;

            loader.add("logo", "goose-1.png");
            loader.add("fireball", "gif.gif");

            loader.load((loader, resources) => {
                resourcesRef.current = resources;

                // setTimeout(() => {
                //     socket?.send(JSON.stringify({ event: "INIT" }));
                // }, 200);

                // const mouse = pixapp.plugin.interaction.mouse;

                const mouse = [0, 0];

                pixapp.view.addEventListener("mousemove", (event) => {
                    mouse[0] = event.offsetX;
                    mouse[1] = event.offsetY;
                });

                let elapsed = 0.0;
                pixapp.ticker.add((delta: number) => {
                    elapsed += delta;

                    handleKeyboardEvent();

                    for (const uid in playersRef.current) {
                        const player = playersRef.current[uid];

                        if (!playersRef.current[uid].sprite) {
                            const sprite = new PIXI.Sprite(resourcesRef.current.logo.texture);
                            playersRef.current[uid].sprite = sprite;
                            (player.sprite as PIXI.Sprite).scale.set(4.0, 4.0);
                            (player.sprite as PIXI.Sprite).anchor.set(0.5, 0.5);
                            pixapp.stage.addChild(sprite);
                        }

                        player.sprite.position.x = player.position[0];
                        player.sprite.position.y = player.position[1];

                        const dx = mouse[0] - player.position[0];
                        const dy = mouse[1] - player.position[1];

                        player.sprite.rotation = Math.atan2(dy, dx);

                        if (player.sprite.rotation < -1) {
                            player.sprite.scale.y = -4;
                        } else {
                            player.sprite.scale.y = 4;
                        }
                    }

                    for (const uid in projectilesRef.current) {
                        const projectile = projectilesRef.current[uid];

                        if (!projectile.sprite) {
                            const sprite = new PIXI.Sprite(resourcesRef.current.fireball.texture);
                            projectile.sprite = sprite;
                            (projectile.sprite as PIXI.Sprite).scale.set(0.5, 0.5);
                            (projectile.sprite as PIXI.Sprite).anchor.set(0.5, 0.5);
                            pixapp.stage.addChild(sprite);
                        }
                        projectile.sprite.position.x = projectile.position[0];
                        projectile.sprite.position.y = projectile.position[1];
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
            if (data.event === "SELF") {
                selfRef.current = data.uuid;
                console.log(data.uuid);
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
