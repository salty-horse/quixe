/* GiBlorb -- a blorb access layer for Quixe
 * Part of Quixe, designed by Andrew Plotkin <erkyrath@eblong.com>
 * <http://eblong.com/zarf/glulx/quixe/>
 * 
 * Javascript library is copyright 2010 by Andrew Plotkin. You may
 * copy and distribute it freely, by any means and under any conditions,
 * as long as the code and documentation is not changed. You may also
 * incorporate code into your own program and distribute that, or
 * modify code and use and distribute the modified version, as long
 * as you retain a notice in your program or documentation which mentions
 * my name and the URL shown above.
 *
 * library parses a Blorb image and provides access to the chunks
 * contained within.
 */

/* Put everything inside the GiBlorb namespace. */
GiBlorb = function() {

var data = (typeof data == "undefined") ? "" : data;

var chunks = [];

// Resources
var resources = {};

function read(offset, n) {
    return data.slice(offset, offset + n);
};

function readInt32(offset) {
    var d = read(offset, 4);
    return d[0] * (1<<24) + d[1] * (1<<16) + d[2] * (1<<8) + d[3];
};

function readFourCC(offset) {
    var d = read(offset, 4);
    return String.fromCharCode.apply(null, d);
};

/* Augment the resource object with its chunk data */
function readResource(resource) {

    return resource;
};

function parseResources(pos) {
    var resource_count = readInt32(pos);

    pos += 4;

    var i;
    for (i = 0; i < resource_count; i++) {
        usage   = readFourCC(pos);
        res_num = readInt32(pos + 4);
        offset  = readInt32(pos + 8);
        pos += 12;

        if (typeof resources[usage] === "undefined")
            resources[usage] = {};

        resources[usage][res_num] = {
            'offset': offset
        }
    }
}

function load_blorb(blorb_data) {
    data = blorb_data;

    var pos = 12;

    while (pos < data.length) {
        var chunk_type = readFourCC(pos);
        var chunk_len  = readInt32(pos + 4);
        pos += 8;

        if (chunk_type == "RIdx")
            parseResources(pos);

        chunks.push({
            'type' : chunk_type,
            'offset' : pos,
            'len' : chunk_len
        });

        pos += chunk_len;
        if (chunk_len & 1)
            pos++;
    }
};

function load_resource(usage, res_id) {
    if (typeof resources[usage] == "undefined")
        return null;

    if (typeof resources[usage][res_id] == "undefined")
        return null;

    var res = resources[usage][res_id];

    var chunk_type = readFourCC(res.offset);
    var chunk_len  = readInt32(res.offset + 4);
    var chunk_data = read(res.offset + 8, chunk_len);

    return {
        "type": chunk_type,
        "data": chunk_data
    };
}

function load_chunk_by_type(type, count) {
    var i;
    for (i = 0; i < chunks.length; i++) {
        if (chunks[i].type == type) {
            if (count == 0)
                return load_chunk_by_number(i);
            count--;
        }
    }

    return null;
}

function load_chunk_by_number(num) {
    if (num >= chunks.length)
        return null;

    var chunk = chunks[num];
    return {
        "type": chunk.type,
        "data": read(chunk.offset, chunk.len)
    };
}

/* End of GiBlorb namespace function. Return the object which will
   become the GiBlorb global. */
return {
    load_blorb: load_blorb,
    load_resource: load_resource,
    load_chunk_by_type: load_chunk_by_type,
    load_chunk_by_number: load_chunk_by_number
};

}();

/* End of GiBlorb library. */
