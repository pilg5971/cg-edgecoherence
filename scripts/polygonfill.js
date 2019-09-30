var view;
var ctx;
var polygons = {
    convex: {
        color: 'purple', //Color
        vertices: [[350, 200], [350, 300],
        [450, 300], [450, 200]]
    },
    concave: {
        color: 'gold', //Color
        vertices: [[300,200],[400,150],[500,200],[500,260],
        [400,210],[300,260]]
    },
    self_intersect: {
        color: 'black', //Color
        vertices: [[150,125],[675,475],[150,475],[675,125]]
    },
    interior_hole: {
        color: 'green', //Color
        vertices: [[290,100], [575,300], [225,300],
        [510,100], [400,450]]
    }
};

//Init(): triggered when web page loads
function Init() 
{
    var w = 800;
    var h = 600;
    view = document.getElementById('view');
    view.width = w;
    view.height = h;

    ctx = view.getContext('2d');
    SelectNewPolygon();    
}

//DrawPolygon(polygon): erases current framebuffer, then draws new polygon
function DrawPolygon(polygon) {
    // Clear framebuffer (i.e. erase previous content)
    ctx.clearRect(0, 0, view.width, view.height);

    // Set line stroke color
    ctx.strokeStyle = polygon.color;

    // Create empty edge table (ET)
    var edge_table = [];
    var i;
    for (i = 0; i < view.height; i++)
	{
        edge_table.push(new EdgeList());
    }

    // Create empty active list (AL)
    var active_list = new EdgeList();

    // Step 1: populate ET with edges of polygon
    var y_min;
    var y_max;
    var x_ymin;
    var delta_x;
    var delta_y;
    var new_edge;
	var i = 0;
    var length = polygon['vertices'].length;

    while(i !== (length - 1))
	{//Calculating 'edges' and appending them to 'edge_table'
		if(polygon['vertices'][i][1] >= polygon['vertices'][i+1][1])
		{
			y_min = polygon['vertices'][i+1][1];
			y_max = polygon['vertices'][i][1];
			x_ymin = polygon['vertices'][i+1][0];
			delta_x = polygon['vertices'][i][0] - polygon['vertices'][i+1][0];
			delta_y = polygon['vertices'][i][1] - polygon['vertices'][i+1][1];
			
			new_edge = new EdgeEntry(y_max, x_ymin, delta_x, delta_y);
			edge_table[y_min].InsertEdge(new_edge);
		}//if1
		else
		{
			y_min = polygon['vertices'][i][1];
			y_max = polygon['vertices'][i+1][1];
			x_ymin = polygon['vertices'][i][0];
			delta_x = polygon['vertices'][i+1][0] - polygon['vertices'][i][0];
			delta_y = polygon['vertices'][i+1][1] - polygon['vertices'][i][1];
			
			new_edge = new EdgeEntry(y_max, x_ymin, delta_x, delta_y);
			edge_table[y_min].InsertEdge(new_edge);
		}//else1
		i++;
    }//while1
	
    if (polygon['vertices'][length-1][1] >= polygon['vertices'][0][1])
	{//Calculating the 'edge' between the first and last vertices
        y_min = polygon['vertices'][0][1];
        y_max = polygon['vertices'][length-1][1];
        x_ymin = polygon['vertices'][0][0];
        delta_x = polygon['vertices'][0][0] - polygon['vertices'][length-1][0];
        delta_y = polygon['vertices'][0][1] - polygon['vertices'][length-1][1];
		
        new_edge = new EdgeEntry(y_max, x_ymin, delta_x, delta_y);
        edge_table[y_min].InsertEdge(new_edge);
    }//if2
    else 
	{
        y_min = polygon['vertices'][length-1][1];
        y_max = polygon['vertices'][0][1];
        x_ymin = polygon['vertices'][length-1][0];
        delta_x = polygon['vertices'][length-1][0] - polygon['vertices'][0][0];
        delta_y = polygon['vertices'][length-1][1] - polygon['vertices'][0][0];
		
        new_edge = new EdgeEntry(y_max, x_ymin, delta_x, delta_y);
        edge_table[y_min].InsertEdge(new_edge);
    }//else2
        
    //Step 2: set y to first scan line with an entry in ET
    var scanLine_y = 0;
    while(edge_table[scanLine_y].first_entry === null)
	{//Locates the first 'edge' and initializes a variable at that index
        scanLine_y += 1;
    }//while2

    // Step 3: Repeat until ET[y] is NULL and AL is NULL
    //   a) Move all entries at ET[y] into AL
    //   b) Sort AL to maintain ascending x-value order
    //   c) Remove entries from AL whose ymax equals y
    //   d) Draw horizontal line for each span (pairs of entries in the AL)
    //   e) Increment y by 1
    //   f) Update x-values for all remaining entries in the AL (increment by 1/m)    
    
    while(scanLine_y !== 600 || active_list.first_entry !== null)
	{        
        var edge = edge_table[scanLine_y].first_entry;
        while(edge !== null )
		{//Populates 'active_list' with 'edges' at index ['scanLine_y']
            active_list.InsertEdge(edge);
            edge = edge.next_entry;
        }//while4
        
        if (active_list.first_entry != null)
		{//Removes entries from 'active_list' whos y_max equals 'scanLine_y'
            active_list.SortList();
            active_list.RemoveCompleteEdges(scanLine_y);
        }//if3
        
        var hold_edge = active_list.first_entry;
        while(hold_edge !== null && hold_edge.next_entry !== null)
		{//Calculates lines to be drawn based on neighboring 'edges' within 'active_list'
            var x1 = Math.ceil(hold_edge.x);
            var x2 = Math.ceil(hold_edge.next_entry.x)-1;
            if(x1 <= x2)
			{
                DrawLine(x1,scanLine_y,x2,scanLine_y);
            }//if4
            hold_edge = hold_edge.next_entry.next_entry;
        }//while5
        scanLine_y += 1;
			
        var temp_edge = active_list.first_entry;
        while(temp_edge !== null )
		{//Increments all x-values within 'active_list' 'edges' by their respective inverse slopes
            temp_edge.x = temp_edge.x + temp_edge.inv_slope;
            temp_edge = temp_edge.next_entry;           
        }//while6		
	}//while3   
}//DrawPolygon

// SelectNewPolygon(): triggered when new selection in drop down menu is made
function SelectNewPolygon() {
    var polygon_type = document.getElementById('polygon_type');
    DrawPolygon(polygons[polygon_type.value]);
}

function DrawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}