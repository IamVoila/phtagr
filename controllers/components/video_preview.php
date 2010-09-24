<?php
/*
 * phtagr.
 * 
 * social photo gallery for your community.
 * 
 * Copyright (C) 2006-2010 Sebastian Felis, sebastian@phtagr.org
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; version 2 of the 
 * License.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

class VideoPreviewComponent extends Object {

  var $controller = null;
  var $components = array('FileCache', 'FileManager', 'Command');

  function initialize(&$controller) {
    $this->controller =& $controller;
  }

  /** Finds the video thumb of a video 
    @param video File model data of the video
    @param insertIfMissing If true, adds the thumb file to the database. Default is true
    @return Filename of the thumb file. False if no thumb file was found */
  function _findThumb($video, $insertIfMissing = true) {
    $videoFilename = $this->controller->MyFile->getFilename($video);
    $path = dirname($videoFilename);
    $folder =& new Folder($path);
    $pattern = basename($videoFilename);
    $pattern = substr($pattern, 0, strrpos($pattern, '.')+1).'[Tt][Hh][Mm]';
    $found = $folder->find($pattern);
    if (count($found) && is_readable(Folder::addPathElement($path, $found[0]))) {
      $thumbFilename = Folder::addPathElement($path, $found[0]);
      $thumb = $this->controller->MyFile->findByFilename($thumbFilename);
      if (!$thumb && $insertIfMissing) {
        $thumbId = $this->FileManager->add($thumbFilename, $video['File']['user_id']);
        Logger::verbose("Add missing video thumb $thumbFilename to database: $thumbId"); 
        $thumb = $this->controller->MyFile->findById($thumbId);
      }
      if (!$thumb) {
        Logger::err("Could not find thumbnail in database");
        return false;
      }
      if ($insertIfMissing &&
        $thumb['File']['media_id'] != $video['File']['media_id'] &&
        $this->controller->MyFile->setMedia($thumb, $video['File']['media_id'])) {
        Logger::verbose("Link video thumb {$thumb['File']['id']} to media {$video['File']['media_id']}"); 
      }
      return $thumbFilename;
    } 
    return false;
  }

  /** Creates a video preview image using ffmpeg 
    @param video File model data of a video
    @param thumbFilename Optional filename of the thumbnail image file
    @return Filename of the video thumbnail. False on failure */
  function create($video, $thumbFilename = '', $overwrite = false) {
    $videoFilename = $this->controller->MyFile->getFilename(&$video);
    $isNew = false;
    if (!file_exists($videoFilename) || !is_readable($videoFilename)) {
      Logger::err("Video file '$videoFilename' does not exists or is readable");
      return false;
    }
    if ($thumbFilename == '') {
      $thumbFilename = $this->_findThumb($videoFilename);
      if (!$thumbFilename) {
        $thumbFilename = substr($videoFilename, 0, strrpos($videoFilename, '.')+1).'thm';
        $isNew = true;
      }
    }
    if (!$overwrite && file_exists($thumbFilename)) {
      Logger::warn("Video thumbnail file '$thumbFilename' already exists");
      return $thumbFilename;
    }
    if (!is_writeable(dirname($thumbFilename))) {
      Logger::err("Could not write video thumb. Path '".dirname($thumbFilename)."' is not writable");
      return false;
    }
    $bin = $this->controller->getOption('bin.ffmpeg');
    if (!$bin) {
      Logger::info("FFmpeg is missing to create video preview. Use phtagrs dummy picture");
      $dummy = APP . 'webroot' . DS . 'img' . DS . 'dummy_video_preview.jpg';
      return $dummy;
    }
    $result = $this->Command->run($bin, array(
      '-i' => $videoFilename, 
      '-t' => 0.001, 
      '-f' => 'mjpeg', 
      '-y', $thumbFilename));
    if ($result != 0) {
      Logger::err("Command '$bin' returned unexcpected $result");
      return false;  
    } else {
      Logger::info("Created video thumbnail of '$videoFilename'");
      if ($isNew) {
        $this->FileManager->add($thumbFilename);
      }
    }
    return $thumbFilename;
  }

  /** Returns the preview filename of the internal cache
    @param image Media model data
    @return Cached preview filename */
  function getPreviewFilenameCache($media) {
    $path = $this->FileCache->getPath($media);
    $file = $this->FileCache->getFilenamePrefix($media['Media']['id']);
    $thumbFilename = $path.$file.'preview.thm';
    return $thumbFilename;
  }

  /** Gets the thumbnail filename of the a video. If it not exists, build it 
    @param image Media model data
    @param options Array of options. Set 'create' to false to disable automaitc
    thumbnail creations. Default is true. Set 'noCache' to true to disable
    thumbnail creation in the cache directory. Default is false. */
  function getPreviewFilename($media, $options = array()) {
    $options = am($options, array('create' => true, 'noCache' => false));

    $thumb = $this->controller->Media->getFile($media, FILE_TYPE_VIDEOTHUMB, false);
    if ($thumb) {
      return $this->controller->MyFile->getFilename($thumb);
    }
  
    if (!$options['noCache']) {
      $cache = $this->getPreviewFilenameCache($media);
      if (file_exists($cache)) {
        return $cache;
      }
    }
    $thumbFilename = false;
    if ($options['create']) {
      $video = $this->controller->Media->getFile($media, FILE_TYPE_VIDEO, false);
      if (!$video) {
        Logger::err("No video file found for media {$media['Media']['id']}");
        return false;
      }
      $videoFile = $this->controller->MyFile->getFilename($video);
      $thumbFilename = $this->_findThumb($video);
      if ($thumbFilename) {
        return $thumbFilename;
      } elseif (!$thumbFilename && is_writeable(dirname($videoFile))) {
        $thumbFilename = $this->create($video);
        $thumb = $this->controller->MyFile->findByFilename($thumbFilename);
        if ($this->controller->MyFile->setMedia($thumb, $video['File']['media_id'])) {
          Logger::verbose("Link thumbnail {$thumb['File']['id']} to media {$video['File']['media_id']}");
        }
      } elseif (!$options['noCache']) {
        Logger::info("Origination directory of video is not writable. Use cache file ($cache)");
        $thumbFilename = $this->create($video, $cache);
      }
    }
    return $thumbFilename;
  }

}

?>
