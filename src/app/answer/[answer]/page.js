import { Pool } from "pg";
import Ans from "../../components/ans";
import stripHtml from "string-strip-html";
import { redirect } from "next/navigation";
// Setup Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://avnadmin:AVNS_wbnbWNwx8GL6oR8t8Yp@pg-5a9838d-codewithsundeep-e969.b.aivencloud.com:26646/defaultdb",
  ssl: process.env.ca
  ? { ca: process.env.ca, rejectUnauthorized: false } // Allow self-signed certificates
  : { rejectUnauthorized: false }, // Disable strict SSL if CA is not provided
});

let dt, aid, m, p;

// Ensure Table Exists
async function createTableIfNotExists() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS answers (
        id SERIAL PRIMARY KEY,
        answer_id BIGINT UNIQUE NOT NULL,
        qtitle TEXT NOT NULL,
        qbody TEXT NOT NULL,
        qtags TEXT NOT NULL,
        abody TEXT NOT NULL,
        creation_date BIGINT NOT NULL,
        last_edit_date BIGINT
      );
    `;
    await pool.query(query);
  } catch (err) {
    console.error("Error creating table:", err);
  }
}

// Fetch Answer from Database
async function getAnswerFromDB(answerId) {
  try {
    const result = await pool.query("SELECT * FROM answers WHERE answer_id = $1", [answerId]);
    // console.log(result)
    return result.rows.length ? result.rows[0] : null;
  } catch (err) {
    console.error("Error fetching from database:", err);
    return null;
  }
}

// Save Answer to Database
async function saveAnswerToDB(answer) {
  try {
    const query = `
      INSERT INTO answers (answer_id, qtitle, qbody, qtags, abody, creation_date, last_edit_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (answer_id) DO NOTHING;
    `;
    await pool.query(query, [
      answer.id,
      answer.qtitle,
      answer.qbody,
      answer.qtags,
      answer.abody,
      answer.creation_date,
      answer.last_edit_date,
    ]);
  } catch (err) {
    console.error("Error saving answer:", err);
  }
}

// Fetch and Manage Answer
async function manageAnswer(id) {
  try {
    await createTableIfNotExists();

    let existingAnswer = await getAnswerFromDB(id);
    if (existingAnswer) {
        // console.log("from database",existingAnswer)
      return existingAnswer;
    }
    console.log("from api")
    let ans = await fetch(`https://api.stackexchange.com/2.3/answers/${id}/?site=stackoverflow&filter=withbody&key=${process.env.key}`);
    let resans = await ans.json();
    // console.log(resans)
    if (!resans.items || resans.items.length === 0) return null;

    let qid = resans.items[0].question_id;
    let qsn = await fetch(`https://api.stackexchange.com/2.3/questions/${qid}/?site=stackoverflow&filter=withbody&key=${process.env.key}`);
    let resqsn = await qsn.json();
    // console.log(resqsn)

    let answerData = {
      id: resans.items[0].answer_id,
      qtitle: resqsn.items[0].title,
      qbody: resqsn.items[0].body,
      qtags: resqsn.items[0].tags.toString(),
      abody: resans.items[0].body,
      creation_date: resans.items[0].creation_date||null,
      last_edit_date: resans.items[0].last_edit_date || null,
    };

    try{
        await saveAnswerToDB(answerData);
        return answerData;
    }catch(err){
        return answerData;
    }
  } catch (err) {
    console.log("Error fetching answer:", err);
    return null;
  }
}

// Generate Metadata
export async function generateMetadata({ params }) {
  try {
    let at = await manageAnswer(params.answer);
    return {
      title: at?.qtitle,
      description: at
        ? at.qtitle + " " + stripHtml(at.qbody.slice(0, 200)).result.replace(/\n|"|\t|\\|\s|  /g, " ")
        : "",
      keywords: at?.qtags.toString(),
      alternates: {
        canonical: `https://example-a.com/answer/${aid}`,
      },
    };
  } catch (err) {
    return "";
  }
}

// JSON-LD for SEO
function jsonld() {
  try {
    return `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "${dt?.qtitle.replace(/\\|\/|:|;|,|\./g, '')}",
        "datePublished": "${new Date(p * 1000).toISOString()}",
        "dateModified": "${new Date(m ? m : p * 1000).toISOString()}",
        "publisher": {
          "@type": "Organization",
          "name": "example-a",
          "logo": {
            "@type": "ImageObject",
            "url": "/code.jpg",
            "width": 600,
            "height": 60
          }
        },
        "image": {
          "@type": "ImageObject",
          "url": "/code.jpg",
          "height": 800,
          "width": 1200
        },
        "description": "${dt ? stripHtml(dt.qbody.slice(0, 700)).result.replace(/\n|"|\t|\\|\s|  /g, ' ') : ''}",
        "url": "/answer/${aid}",
        "mainEntityOfPage": "/answer/${aid}"
      }
      </script>
    `;
  } catch (err) {
    return "";
  }
}

// Page Component
export default async function ans({ params }) {
  try {
    dt = await manageAnswer(params.answer);
    // console.log("the data is",dt,params)
    return (
      <div id="answercontent">
        <div dangerouslySetInnerHTML={{ __html: jsonld() }}></div>
        <Ans id={params.answer} ms={dt} />
      </div>
    );
  } catch (error) {
    console.error("Error:", error);
    redirect("/");
  }
}
