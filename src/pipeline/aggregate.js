/*
i now have
- list of contests
- for each contest
    - ratings: participants + their ratings before and after
    - standings: participants + their performance

i want
- a json with an array of rows
- where each row is (contestid, problem, ratings bucket, solved, failed, never attempted)

steps
- for each file
    - read ratings, standings
    - go through ratings: create map of user handle -> ratings 
    - go through standings: create array/list of map of ratings bucket -> solved, failed, never attempted. by using the above map to put into ratings bucket
    - append this to some big outer list
- write big list to file

future things
- i want to be able to query for a problem and get the distribution
- problems are uniquely identified by contestId+problemIndex (maybe not, shared problems across divs have different contest ids, todo later feature to deal with this. maybe merge on problem name from adjacent contest ids?)
- so given id (contestId, problemIndex) i want to problem info + dist
- no api for directly getting problem info so i will need to maintain another table of (key, problemInfo)
- and join later on the id 
*/