import { MongoClient } from "mongodb";

const uri = "mongodb://127.0.0.1:27017";

const client = new MongoClient(uri);

(async () => {
    try {
        await client.connect();
        const db = client.db("42matrix");
        const CSTUDENTS = db.collection("students");
        const CPROJECTS = db.collection("projects");

        const projectsByRealisationDate = {};

        const students = await CSTUDENTS.find({}).toArray();

        for (const student of students) {
            for (const project of student.projects_users ?? []) {
                // console.log(!project.marked_at, !project.marked, !project.cursus_ids.includes(21));

                // if (!project.project.name.includes("doom")) continue;

                if (
                    project.final_mark === 0 ||
                    !project.marked_at ||
                    !project.marked ||
                    (!project.cursus_ids.includes(21) && !project.cursus_ids.includes(9))
                ) {
                    continue;
                }

                const key = `${project.project.id} ${project.project.name}`;

                if (!projectsByRealisationDate[key]) projectsByRealisationDate[key] = [];

                projectsByRealisationDate[key].push({
                    login: student.login,
                    date: project.marked_at,
                });
            }
        }

        for (const project in projectsByRealisationDate) {
            projectsByRealisationDate[project].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            projectsByRealisationDate[project] = projectsByRealisationDate[project][0];
        }

        console.log(projectsByRealisationDate);
        // console.log(students.length);
        // console.log(STUDENTS);
        // const deleted = await Students.deleteMany({});

        // console.log("Done", deleted);

        await client.close();
    } catch (error) {
        console.error(error);
        await client.close();
    }
})();
