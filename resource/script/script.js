
     
    var URL_API = "http://192.168.100.115:3001" ;
    
    var shiftPress = false;

    function getDataFromAPI(url1) {
        var dataOut ;
        console.log(url1);
        $.ajax({
            method: "GET",
            url: url1,
            async: false,
            success: function (data) { 
                dataOut = data; 
            },
            
        });
        return dataOut;
    };
    
    
    
    try {
        var nodeList = nodeListText;
        var edgeList = edgeListText;
    }
    catch(err) {
        var nodeList = getDataFromAPI(URL_API + "/address/getVertexList");
        var edgeList = getDataFromAPI(URL_API + "/address/getEdgeList");
    }
    


    console.log(nodeList);
    console.log(edgeList);

    // creat graph
    var graph = Viva.Graph.graph();

    nodeList.forEach(function(item) {
        // if(item.trf_level == "kho_tong")
        //     // graph.addNode(item[0], item[1]).isPinned = true ;
        //     isPinnedNode[item.id] = graph.addNode(item.id, item);
        // else
            graph.addNode(item.id, item) ;
        
    });
    
    edgeList.forEach(function(item){
        if(item.trf_type !="fly")
            graph.addLink(item.fr_stid, item.to_stid, item.trf_type) ;
    });

    

    // layout
    var layout = Viva.Graph.Layout.forceDirected(graph, {
        springLength : 220,
        springCoeff : 0.0008,
        dragCoeff : 0.06,
        gravity : -0.9
     });


    // customize node
    var graphics = Viva.Graph.View.svgGraphics(),
        nodeSize = 30,
        hightlightRelateNodes = function(nodeId, isOn) {
            graph.forEachLinkedNode(nodeId, function(node, link) {
                var isFly = (link.data == "fly");
                var linkUI = graphics.getLinkUI(link.id) ;
                
                if(linkUI) {
                    if(!linkUI.baseColor)
                        linkUI.baseColor = "blue" ;
                    if(isFly)
                        linkUI.baseColor = "red";
                    linkUI.attr("stroke", isOn ? "yellow" : linkUI.baseColor);
                }
            });
        };
    
    var baseX = -640;
    var baseY = -555;
    var countID = 0;
    graphics.node(function(node) {
        // console.log(node.links);
        if(node.links ==null) {
            layout.pinNode(node, true);
            if(countID%2 ==0) {
                baseX = -840;
                baseY += 60;
            }
            else
                baseX = -640;

            layout.setNodePosition(node.id, baseX, baseY);
            countID++;
        }
        else if(typeof(node.data)!="undefined" && node.data.lat !="" && node.data.lng !="" && node.data.trf_level =="kho_tong") {
            
            var x =  parseFloat(node.data.lng)*100 - 10700;
            var y = -parseFloat(node.data.lat)*100 + 1500 ;
            // console.log(node.data, x, y);
            layout.pinNode(node, true);
            layout.setNodePosition(node.id, x, y);
        }

        if(typeof(node.data) == "undefined") {
            console.log("Kho loi: ", node.id);
            node.data = {
                "id": node.id,
                "name": "Kho Lỗi",
                "trf_level": "kho loi",
                "lat": "11.9963972",
                "lng": "107.5144652",
                "type": "station"
            };
        }
        

        var trf_levell = node.data.trf_level;
        if(trf_levell =="kho_tong")
            var imgFile = 'resource/img/ghtk.png' ;
        else if(trf_levell =="buu_cuc")
            var imgFile = 'resource/img/node.jpg' ;
        else
            var imgFile = 'resource/img/error.jpg' ;
        
        var ui  =  Viva.Graph.svg('g'),
        stationName = Viva.Graph.svg('text').attr('y', '-5px').text("["+node.id+"] "+node.data.name),
        img = Viva.Graph.svg('image')     
            .attr('width', nodeSize)
            .attr('height', nodeSize)
            .link(imgFile);
        ui.append(stationName) ;
        ui.append(img);
        ui.addEventListener('click', function () {
            if(shiftPress)
                layout.pinNode(node, !layout.isNodePinned(node));
            
        });
        
        $(ui).hover(function(){
            hightlightRelateNodes(node.id, true);
        }, function() {
            hightlightRelateNodes(node.id, false) ;
        });
        return ui;
    }).placeNode(function(nodeUI, pos) {
        // console.log(pos);
        nodeUI.attr('transform',
            'translate(' +
            (pos.x - nodeSize / 2) + ',' + (pos.y - nodeSize / 2) +
            ')');
        
    });
    
    // creat Marker direct link
    var createMarker = function(id) {
            return Viva.Graph.svg('marker')
                        .attr('id', id)
                        .attr('viewBox', "0 0 10 10")
                        .attr('refX', "10")
                        .attr('refY', "5")
                        .attr('markerUnits', "strokeWidth")
                        .attr('markerWidth', "10")
                        .attr('markerHeight', "5")
                        .attr('orient', "auto");
        },

        marker = createMarker('Triangle');

    marker.append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z');

    var defs = graphics.getSvgRoot().append('defs');
    defs.append(marker);

    var geom = Viva.Graph.geom();
    
    // Custom link
    graphics.link(function(link){
        var isFly = (link.data == 'fly'),
            
        uil = Viva.Graph.svg('path')
                    .attr('stroke', isFly ? 'red' : 'blue')
                    .attr('fill', 'none')
                    .attr('marker-end', 'url(#Triangle)');
        uil.isFly = isFly ;
        return uil;
    }).placeLink(function(linkUI, fromPos, toPos) {
        var toNodeSize = nodeSize,
            fromNodeSize = nodeSize;

        var from = geom.intersectRect(
                // rectangle:
                        fromPos.x - fromNodeSize / 2, // left
                        fromPos.y - fromNodeSize / 2, // top
                        fromPos.x + fromNodeSize / 2, // right
                        fromPos.y + fromNodeSize / 2, // bottom
                // segment:
                        fromPos.x, fromPos.y, toPos.x, toPos.y) || fromPos;

        var to = geom.intersectRect(
                // rectangle:
                        toPos.x - toNodeSize / 2, // left
                        toPos.y - toNodeSize / 2, // top
                        toPos.x + toNodeSize / 2, // right
                        toPos.y + toNodeSize / 2, // bottom
                // segment:
                        toPos.x, toPos.y, fromPos.x, fromPos.y) || toPos; 
        
        var ry = linkUI.isFly ? 5 : 0,
        data = 'M' + from.x + ',' + from.y +
                //    'L' + to.x + ',' + to.y;
                    ' A 5,' + ry + ',-10,0,1,' + to.x + ',' + to.y;
        linkUI.attr('d', data);
    });

    // Render the graph
    var renderer = Viva.Graph.View.renderer(graph, {
        layout    : layout,
        graphics  : graphics,
        container : document.getElementById('graphContainer')
    }) ;
            
    function renderGraph() {
        renderer.run();
        hideBC();
    };

    function pauseRender() {
        $("#btnPause").addClass("hide");
        $("#btnResume").removeClass("hide");
        renderer.pause();
    };
    
    function resumeRender() {
        $("#btnPause").removeClass("hide");
        $("#btnResume").addClass("hide");
        renderer.resume();
    };

    var edgeHightlightGlobal = [];

    function hightlightRoute() {
        // var route = [1121, 1260, 657, 705 ];
        

        var edgeHightlight = [];
        for(i=0; i< routeGlobal.length -1; i++) {
            highlightNode(routeGlobal[i], "red");
            edgeHightlight.push([routeGlobal[i], routeGlobal[i+1]]);
            edgeHightlight.push([routeGlobal[i+1], routeGlobal[i]]);
        }
        highlightNode(routeGlobal[routeGlobal.length-1], "red");
        edgeHightlightGlobal = edgeHightlight;
        console.log("EDGE GLOBAL: ", edgeHightlightGlobal);

        for(i=0; i< edgeHightlight.length; i++) {
            hightlightLink(edgeHightlight[i], "red") ;
        }
    };

    function hightlightLink(edge, color) {
        var link_edge = graph.getLink(edge[0], edge[1]);
        if(link_edge) {
            var linkUI = graphics.getLinkUI(link_edge.id) ;
            $(linkUI).show();
            linkUI.attr("stroke", color);
            linkUI.baseColor = color;
        }

    };

    function highlightNode(nodeId, color) {
        var ui = graphics.getNodeUI(nodeId);
        if(ui) {
            $(ui).show();
            ui.attr('fill', color);
        }
    };
    
    var routeGlobal = [];
    function getRoute() {
        var route = [];
        var src = $("#fromStation").val();
        var dst = $("#toStation").val();
        dataSend = {src: src, dst: dst} ;
        // console.log(dataSend);
        $.ajax({
            method: "POST",
            url: "http://192.168.100.115:3001/address/getRoute",
            async: false,
            data: dataSend,
            success: function (data) { 
                route = data; 
            },
            
        });
        console.log("route:", route)
        resetColor();
        if(route.length == 0) {
            $(".msgOut").html("Chưa config tuyến đường này!");
            $("#setRouteInput").val(src+ " xxx " + dst) ;
            highlightNode(src, "red");
            highlightNode(dst, "red");
            routeGlobal.push(src);
            routeGlobal.push(dst);
            
        }
        else {
            var msg = "Tuyến config: " + route.join(" ");
            
            $(".msgOut").html(msg);
            $("#setRouteInput").val(route.join(" ")) ;

            routeGlobal = route;
            hightlightRoute();

        }
    };

    function resetColor() {
        for(i=0; i< routeGlobal.length; i++) {
            highlightNode(routeGlobal[i], "black");
        }
        
        for(i=0; i<edgeHightlightGlobal.length; i++){
            hightlightLink(edgeHightlightGlobal[i], "blue");
            
        }

        $(".msgOut").html("");
        $("#fromStation").val("");
        $("#toStation").val("");
        $("#setRouteInput").val("") ;
        if(isHideBC)
            hideBC();
        
    };

    function setRoute() {
        var path_data = $("#setRouteInput").val();
        console.log(path_data);
        dataSend = {path: path_data};
        console.log(dataSend);
        var msg = "<span style='margin-left: 430px;'>Status set route: ";
        $.ajax({ 
            method: "POST",
            url: "http://192.168.100.115:3001/address/setRoute",
            async: false,
            data: dataSend,
            success: function (data) { 
                msg += data.status; 
                msg += "</span>" ;
            },
            
        });
        $(".msgOut").html(msg);
        

    }


    function hideMap() {
        $("#frame").addClass("hide");
        $("#btnHideMap").addClass("hide");
        $("#btnShowMap").removeClass("hide");

    }
    function showMap() {
        $("#frame").removeClass("hide");
        $("#btnShowMap").addClass("hide");
        $("#btnHideMap").removeClass("hide");

    }
    
    var isHideBC = true;

    function hideBC() {
        $("#btnHideBC").addClass("hide");
        $("#btnShowBC").removeClass("hide");

        graph.forEachNode(function(node){
            if(node.data.trf_level =="buu_cuc") {
                var nodeUI = graphics.getNodeUI(node.id);
                $(nodeUI).hide();
                graph.forEachLinkedNode(node.id, function(node, link) {
                    var linkUI = graphics.getLinkUI(link.id) ;
                    $(linkUI).hide();
                });

            }
        });
        isHideBC = true;

    }
    function showBC() {
        $("#btnShowBC").addClass("hide");
        $("#btnHideBC").removeClass("hide");
        graph.forEachNode(function(node){
            if(node.data.trf_level =="buu_cuc") {
                var nodeUI = graphics.getNodeUI(node.id);
                $(nodeUI).show();
                graph.forEachLinkedNode(node.id, function(node, link) {
                    var linkUI = graphics.getLinkUI(link.id) ;
                    $(linkUI).show();
                });

            }
        });
        isHideBC = false;

    }

    document.addEventListener('keydown', function(e) {
        if (e.which === 16) { // shift key
          shiftPress = true;
        }
    });
    document.addEventListener('keyup', function(e) {
        if (e.which === 16) { // shift key
          shiftPress = false;
        }
    });