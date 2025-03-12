/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZHJpbm5pcmQiLCJhIjoiY201b2RyYXRhMGt1YTJvcHQ4ZjU4dDYycSJ9.jHNRKSu149-F5s157m1GwA'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/mapbox/streets-v12',  // ****ADD MAP STYLE HERE *****
    center: [-79.39, 43.68],  // starting point, longitude/latitude
    zoom: 10 // starting zoom level
});


/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable

let colljson;
let bboxjson;

fetch('https://drinnnird-uoft.github.io/ggr472-lab-04/data/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        colljson = response;
    });


/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function
//      **Option: You may want to consider how to increase the size of your bbox to enable greater geog coverage of your hexgrid
//                Consider return types from different turf functions and required argument types carefully here

map.on('load', () => {
    // delcare legend variable using legend div tag
    const legend = document.getElementById("legend");

    let bboxenv = turf.envelope(colljson);

    // scale up the bounding box to collect all the points
    let bboxscaled = turf.transformScale(bboxenv, 1.1);

    // get BBox for hexGrid
    let coords = turf.bbox(bboxscaled);

    // create a hexgrid using the bounding box coordinates
    let hexdata = turf.hexGrid(coords, 0.5, {units: "kilometers"});

    // count up collisions per hex grid
    // also store max collision count to make a color scale for the legend

    let maxcollisions = 0;

    let collishex = turf.collect(hexdata, colljson, "_id", "values");

    collishex.features.forEach((feature) => {
        feature.properties.COUNT = feature.properties.values.length; // count up the unique data points inside the hex and put in COUNT
        if(feature.properties.COUNT > maxcollisions) {
            maxcollisions = feature.properties.COUNT; // conditionally update the max collisions counter
        }
    })

    // add the hexgrid source to the map
    map.addSource("collishexgrid", {
        type: "geojson",
        data: hexdata
    })

    // add layer to visualize hex grid
    // use a color ramp as the fill paint
    // use maxcollisions as the upper bound for the color ramp
    // get COUNT property of each feature to colorize
    map.addLayer({
        id: "collishexfill",
        type: "fill",
        source: "collishexgrid",
        paint: {
            "fill-color" : [
                "step",
                ["get", "COUNT"],
                "#ffffff",
                10, "#ffebf1",
                25, "#ffa0a6",
                maxcollisions, "#ff0000"
            ],
            "fill-opacity" : 0.8
        },
        filter: ["!=", "COUNT", 0]
    })

    map.setLayoutProperty("collishexfill", "visibility", "visible"); // default to visible
    legend.style.display = 'block';

    // add event listener to toggle hexgrid on and off
    document.getElementById("overlaybutton").addEventListener('click', () => {
        const visibility = map.getLayoutProperty(
            "collishexfill",
            'visibility'
        );

        // Toggle layer visibility by changing the layout object's visibility property.
        if (visibility === 'visible') {
            map.setLayoutProperty("collishexfill", 'visibility', 'none');
        } else {
            map.setLayoutProperty(
                "collishexfill",
                'visibility',
                'visible'
            );
        }

        // Toggle legend too
        const legendvisible = legend.style.display;
        if(legendvisible === 'block') {
            legend.style.display = 'none'
        } else {
            legend.style.display = 'block'
        }

        
    })

    // build the legend

    const legendlabels = [
        '1-9',
        '10-24',
        '25-' + (maxcollisions-1),
        maxcollisions
    ];

    const legendcolours = [
        '#ffffff',
        '#ffebf1',
        '#ffa0a6',
        '#ff0000'
    ];

    // for each layer create a block to put the colour and label in
    legendlabels.forEach((label, i) => {
        const colour = legendcolours[i];

        const item = document.createElement('div') //each layer gets a 'row' - this isn't in the legend yet, we do this later
        const key = document.createElement('span') //add a 'key' to the row. A key will be the colour circle

        key.className = 'legend-key'; //the key will take on the shape and style properties defined in css
        key.style.backgroundColor = colour; // the background color is retreived from teh layers array

        const value = document.createElement('span'); //add a value variable to the 'row' in the legend
        value.innerHTML = `${label}`; //give the value variable text based on the label

        item.appendChild(key); //add the key (colour cirlce) to the legend row
        item.appendChild(value); //add the value to the legend row
    
        legend.appendChild(item); //add row to the legend
    })

    // create dynamically generated popups based on the COUNT property of the hex grid
    map.on('click', 'collishexfill', (e) => {
        new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(e.features[0].properties.COUNT + ' collision' + (e.features[0].properties.COUNT > 1 ? 's' : ''))
        .addTo(map)
    })

    // update cursor to tell user something is clickable
    map.on('mousemove', 'collishexfill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
    })

    map.on('mouseleave', 'collishexfill', (e) => {
        map.getCanvas().style.cursor = '';
    })
})

// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows


