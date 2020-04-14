/*
ANIME BENSALEM, BRIAHANA MAUGÉ, JOSEPH P. PASAOA
Events Route Queries | Capstone App (Pursuit Volunteer Mgr)
*/

/* DB CONNECTION */
const db = require('../db/db');

// const eventFollowsQueries = require('./eventFollows');
// const eventVolunteersQueries = require('./eventVolunteers');


/* HELPER FUNCTION */
const formatStr = str => {
  return str.toLowerCase()
}

/* QUERIES */


// Get all events (past events are auto pushed to the back)
const getAllEvents = async (vName, topic, instructor, upcoming, past) => {


  const selectQuery = `
  SELECT events.event_id, events.topic, events.event_start, events.event_end, events.description, events.location, 
    events.instructor, events.number_of_volunteers AS volunteers_needed, ARRAY_AGG (DISTINCT cohorts.cohort) AS cohort,
    ARRAY_AGG ( 
      DISTINCT
      CASE 
        WHEN event_volunteers.confirmed = TRUE 
        THEN volunteers.v_first_name || ' ' || volunteers.v_last_name
        END
    ) AS volunteers
  FROM events

  INNER JOIN cohorts ON cohorts.cohort_id = events.attendees
  INNER JOIN event_volunteers ON event_volunteers.eventv_id = events.event_id
  INNER JOIN volunteers ON volunteers.v_id = event_volunteers.volunteer_id
  
  WHERE events.deleted IS NULL
  
  GROUP BY  events.event_id, events.topic, events.event_start, events.event_end, events.description, events.location, 
    events.instructor, events.number_of_volunteers, cohorts.cohort     

  let endOfQuery = `GROUP BY  events.event_id, events.topic, events.event_start, events.event_end, events.description, events.location, 
    events.instructor, events.number_of_volunteers, cohorts.cohort     
  ORDER BY (
    CASE WHEN DATE(event_start) > now()
        THEN 1
        ELSE 0
        END
        ) 
  DESC, event_start ASC
  `
  if (lowercasevName === '' && lowercaseTopic === '' && lowercaseInstructor === '' && upcoming === '' && past === '') {
    return await db.any(selectQuery + endOfQuery);
  }
  else if (lowercaseTopic === '' && lowercaseInstructor === '' && upcoming === '' && past === '') {
    return await db.any(`${selectQuery} WHERE lower(volunteers.v_first_name) = $/lowercasevName/ OR lower(volunteers.v_last_name) = $/lowercasevName/ OR lower(volunteers.v_first_name || ' ' || volunteers.v_last_name) = $/lowercasevName/
     ${endOfQuery}`, { lowercasevName });
  }
  else if (lowercasevName === '' && lowercaseInstructor === '' && upcoming === '' && past === '') {
    return await db.any(`${selectQuery} WHERE LOWER (events.topic) LIKE '%' || $/lowercaseTopic/ || '%' ${endOfQuery}`, { lowercaseTopic });
  }
  else if (lowercasevName === '' && lowercaseTopic === '' && upcoming === '' && past === '') {
    return await db.any(`${selectQuery} WHERE LOWER (events.instructor) LIKE '%' || $/lowercaseInstructor/ || '%' ${endOfQuery}`, { lowercaseInstructor });
  }
  else if (lowercasevName === '' && lowercaseTopic === '' && lowercaseInstructor === '' && past === '') {
    return await getUpcomingEvents();
  } else {
    return await getPastEvents();
  }


}

const getSingleEvent = async (eId) => {
  const selectQuery = `
  SELECT events.event_id, events.topic, events.event_start, events.event_end, events.description, events.location, 
    events.instructor, events.number_of_volunteers AS volunteers_needed, ARRAY_AGG (DISTINCT cohorts.cohort) AS cohort,
    ARRAY_AGG ( 
      DISTINCT
      CASE 
        WHEN event_volunteers.confirmed = TRUE 
        THEN volunteers.v_first_name || ' ' || volunteers.v_last_name
        END
    ) AS volunteers
    
  FROM events
  INNER JOIN cohorts ON cohorts.cohort_id = events.attendees
  INNER JOIN event_volunteers ON event_volunteers.eventv_id = events.event_id
  INNER JOIN volunteers ON volunteers.v_id = event_volunteers.volunteer_id
       
  WHERE events.event_id = $/eId/ AND event.deleted IS NULL

  GROUP BY  events.event_id, events.topic, events.event_start, events.event_end, events.description, events.location, 
    events.instructor, events.number_of_volunteers, cohorts.cohort     

  ORDER BY (
    CASE WHEN DATE(event_start) > now()
        THEN 1
        ELSE 0
        END
        ) 
  DESC, event_start ASC
  `;
  return await db.any(selectQuery, { eId });
}

const getAllEventsAdmin = async () => {
  const selectQuery = `
  SELECT events.event_id, events.topic, events.event_start, events.event_end, events.description, events.location, 
    events.instructor, events.number_of_volunteers AS volunteers_needed, ARRAY_AGG (DISTINCT cohorts.cohort) AS cohort, 
    ARRAY_AGG ( DISTINCT volunteers.v_first_name || ' ' || volunteers.v_last_name) AS volunteers
  
  FROM events
  INNER JOIN cohorts ON cohorts.cohort_id = events.attendees
  INNER JOIN event_volunteers ON event_volunteers.eventv_id = events.event_id
  INNER JOIN volunteers ON volunteers.v_id = event_volunteers.volunteer_id
            
  WHERE events.deleted IS NULL

  GROUP BY  events.event_id, events.topic, events.event_start, events.event_end, events.description, events.location, 
    events.instructor, events.number_of_volunteers, cohorts.cohort
         
  ORDER BY (CASE WHEN DATE(event_start) > now()
    THEN 1
    ELSE 0
    END
    ) 
  DESC, event_start ASC
  `;
  return await db.any(selectQuery);
}

//Get Single Event for Admin
const getSingleEventAdmin = async (eId) => {
  const selectQuery = `
  SELECT events.event_id, events.topic, events.event_start, events.event_end, events.description, events.location, 
  events.instructor, events.number_of_volunteers AS volunteers_needed, ARRAY_AGG (DISTINCT cohorts.cohort) AS cohort, 
  ARRAY_AGG ( DISTINCT volunteers.v_first_name || ' ' || volunteers.v_last_name) AS volunteers
  
  FROM events
  INNER JOIN cohorts ON cohorts.cohort_id = events.attendees
  INNER JOIN event_volunteers ON event_volunteers.eventv_id = events.event_id
  INNER JOIN volunteers ON volunteers.v_id = event_volunteers.volunteer_id
  
  WHERE events.event_id = $/eId/ AND events.deleted IS NULL

  GROUP BY  events.event_id, events.topic, events.event_start, events.event_end, events.description, events.location, 
    events.instructor, events.number_of_volunteers, cohorts.cohort
  `
  return await db.one(selectQuery, { eId });
}

// Get all upcoming events
async function getUpcomingEvents() {
  const selectQuery = `
  SELECT * 
  FROM events 
  WHERE event_start > now() AND deleted IS NULL
  ORDER BY event_start ASC
  `;
  return await db.any(selectQuery);
}

// Get all past events
async function getPastEvents() {
  const selectQuery = `
  SELECT * 
  FROM events 
  WHERE event_start < now() AND deleted IS NULL
  ORDER BY event_start ASC
  `;
  return await db.t(selectQuery);
}

// delete events
const deleteEvent = async (id) => {
  const deleteQuery = `
  UPDATE events
  SET deleted = NOW()
  WHERE event_id = $1
  RETURNING *
  `;

  const promises = [];
  promises.push(db.one(deleteQuery, id));
  // promises.push(eventVolunteersQueries.delete...(id, true));
  // promises.push(eventFollowsQueries.delete...(fId, true));

  const response = await Promise.all(promises);
  return response[0];
}

// Get all past events by volunteer Id
const getPastEventsByVolunteerId = async (id) => {
  const selectQuery = `
    SELECT event_id, topic, event_start
    FROM events 
    INNER JOIN event_volunteers ON event_id = ev_id
    WHERE event_start < now() AND volunteer_id = $1 AND confirmed = TRUE
    ORDER BY event_start ASC
  `;
  return await db.any(selectQuery, id);
}


/* EXPORT */
module.exports = {
  getAllEvents,
  getSingleEvent,
  getAllEventsAdmin,
  getSingleEventAdmin,
  getUpcomingEvents,
  getPastEvents,
  getPastEventsByVolunteerId,
  deleteEvent
}
