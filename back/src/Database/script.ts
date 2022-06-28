import { MongoClient } from "mongodb";

const uri = "mongodb://127.0.0.1:27017";

const client = new MongoClient(uri);

(async () => {
    try {
        await client.connect();
        const db = client.db("42matrix");
        const Students = db.collection("students");

        const deleted = await Students.deleteMany({});

        console.log("Done", deleted);
    } catch (error) {
        console.error(error);
        await client.close();
    }
})();
